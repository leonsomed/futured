futured discloses secrets when a target time arrives. Its job is to use secrets to generate time-based hashes. The rational is that a user wants to reveal a secret to the public, but only at a certain time. It is perfect for a [dead man's switch](https://en.wikipedia.org/wiki/Dead_man%27s_switch).

futured is only one part of the mechanism for a dead man's switch, it is not intended to store or serve actual content, instead it serves time-based hashes salted with a secret. The hashes can be used as decryption keys for content hosted somewhere else. The service is extremly simple, and has no dependencies to minimize attack surface.

futured is a replication service that interacts with a pool of identical nodes. Each node relays the encrypted state to other nodes. Each node is deployed with a known shared secret and it is the responsibility of the node maintainer to acquire the shared secret beforehand. The service can persist the latest state to a local file to support restarting to the last known state. This can be disabled to avoid writing files to disk. This local file mechanism is there only to support the case where all nodes happen to go down simultaneously, which should be practically impossible if the pool is setup correctly. For instance, using different cloud providers, mixing cloud and on-premise, and distributing across regions.

futured supports node discovery thourgh state decryption. futured assumes all nodes are honest as long as they can provide valid encrypted content. If the shared secret is compromised then malicious nodes can control the full state of the network. Node operators would need to monitor for such an event and deploy with a new secret.

## Immutability

A layer of resiliency consists of enabling namespace immutability so an attacker would need to control all nodes to shut down the service. The way it works is that if immutability is enabled then a namespace cannot be changed. Nodes will continue to accept the state changes, but they will discard any state that would result in overriding an existing namespace. However, making node state immutable means that it would be impossible to remove content that you no longer want to expose. This is the case if you happen to change the target date and no longer want the prevous date to work. This is a tradeoff and futured offers this as an opt-in feature. The node maintainer sends signals to the service to indicate when immutability should be disabled. Once disabled if a new signal hasn't been received in x amount of time, then the node becomes immutable again. The signal is a signed timestamp with GPG. Nodes will have the public key of the node maintainer to verify the signature. The rational is the signal contains a timestamp, this timestamp indicates when immutability will be disabled so it must be a future date. Then there is a signature field which is the signed timestamp with the authors private key. Nodes can verify that the signature belongs to the public key they have on disk. This way the attacker would need to control every single node to shut down the service.

## Disclaimer

It is important to consider that futured is a simple HTTP service and as such it is vulnerable to numerous attacks that can reveal sensitive information. Such as the hash (before the configured future date), the target date, and the secret associated to the hash. Of course, this would only happen if the attacker is sophisticated enough. As such you should use under your own resposability. Realistically speaking, this could only happen if someone happens to get physical or remote access to the machine. This most likely could happen by court mandate or when running in an insecure cloud. Also, access could be achieved via some vulnerability, however, to mitigate against that the service relies only on native modules.

futured was designed to be only one part of a dead man's switch, it is not enough for an attacker to gain access to this service, they would also need to have access to the encrypted content that is protected by the time-based hash returned by this service. That content is not stored or referenced in this service at all. Therefor plan your strategy accordingly.

## Possible setup

- App connects to futured service thourgh Tor or a secure VPN and requests today's date from start of day like: 2026-01-15T00:00:00.000Z
- App decrypts file with hash received to reveal a script and media files
- App executes script with instructions to send email with attachments that were also decrypted (change this action for whatever you need)
- App deletes decrypted content

You can get creative and might be able to compromise on certain steps depending on your treat model. This is very helpful for inheritance purposes if there happens to be
something sensitive you wish to share such as the location of your BIP 39 seed phrase backup along with other detailed instructions.

You can also combine the hash with a known password that way you give a person a password and they can only decrypt the content when the target date has arrived. Of course you would need to explain it to them or provide some sort of app that will handle the decryption process. Keep in mind that the more complexity you add the higher the chances your dead man trigger won't actually trigger.

## Getting started

For local development and testing set it up as follows:

```bash
openssl req -newkey rsa:2048 -new -nodes -x509 -days 10000 -keyout server-key.pem -out server-cert.pem
node ./src/scripts/create-key.js
mv .env.new .env
# echo "\nDISABLE_WRITE=true" >> .env # enable only if you want to disable writing to disk
node --env-file=.env ./src/scripts/create-state.js
node --env-file=.env ./src/scripts/encrypt-state.js

# setting up 3 local instances
PORT=8000 SELF=localhost:8000 NAME=a node --env-file=.env src/index.js
PORT=8001 SELF=localhost:8001 NAME=b node --env-file=.env src/index.js
PORT=8002 SELF=localhost:8002 NAME=c node --env-file=.env src/index.js
```

## How to generate a hash to encrypt your files

It is best to run this in an airgap device. You don't really need to have the whole codebase, simply referenace the implementation of how hashes are generated, here is an example:

```js
// put this script in hash.js
console.log(require("node:crypto").hash("sha256", `${new Date('2026-01-01T00:00:00.000Z').getTime()}:your_secret`));

// run it in a shell
node hash.js
```

If you are just testing you can just run the script:

```bash
node --env-file=.env ./src/scripts/get-hash.js
```
