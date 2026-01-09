futured discloses secrets when a target time arrives. Its job is to use secrets to generate time-based hashes. The rational is that a user wants to reveal a secret to the public, but only at a certain time. It is perfect for a [dead man's switch](https://en.wikipedia.org/wiki/Dead_man%27s_switch).

futured is only one part of the mechanism for a dead man's switch, it is not intended to store or serve actual content, instead it serves time-based hashes salted with a secret. The hashes can be used as decryption keys for content hosted somewhere else. The service is extremly simple, and has no dependencies to minimize attack surface.

futured is a replication service that interacts with a pool of identical nodes. Each node relays the encrypted state to other nodes. Each node is deployed with a known shared secret and it is the responsibility of the node maintainer to acquire the shared secret beforehand. The service can persist the latest state to a local file to support restarting to the last known state. This can be disabled to avoid writing files to disk. This local file mechanism is there only to support the case where all nodes happen to go down simultaneously, which should be practically impossible if the pool is setup correctly. For instance, using different cloud providers, mixing cloud and on-premise, and distributing across regions.

futured supports node discovery thourgh state decryption. futured assumes all nodes are honest as long as they can provide valid encrypted content. If the shared secret is compromised then malicious nodes can control the full state of the network. Node operators would need to monitor for such an event and deploy with a new secret. One possible solution against this is to make state namespaces immutable so an attacker would need to control all nodes. However, making node state immutable means that it would be impossible to remove content that you no longer want to expose. This is the case if you happen to change the target date and no longer want the prevous date to work. This is a tradeoff.

A possible solution to this problem is to implement a ping signal mechanism, if the ping signal is no longer received, then the node becomes immutable. The only way to undo it is to receive a signal. The signal would be a signature that can be verified with GPG so that only need node mantainer can emit it and nodes can verify it by having access to the public key. There can also be a specific signal to immediately enforce immutability instead of waiting for the timeout behavior.

## Disclaimer

It is important to consider that futured is a simple HTTP service and as such it is vulnerable to numerous attacks that can reveal sensitive information. Such as the hash (before the configured future date), the target date, and the secret associated to the hash. Of course, this would only happen if the attacker is sophisticated enough. As such you should use under your own resposability. Realistically speaking, this could only happen if someone happens to get physical or remote access to the machine. This most likely could happen by court mandate or when running in an insecure cloud. Also, access could be achieved via some vulnerability, however, to mitigate against that the service relies only on native modules.

futured was designed to be only one part of a dead man's switch, it is not enough for an attacker to gain access to this service, they would also need to have access to the encrypted content that is protected by the time-based hash returned by this service. That content is not stored or referenced in this service at all. Therefor plan your strategy accordingly.

## Possible setup

- App connects to futured service thourgh Tor or a secure VPN and requests today's date from start of day like: 2026-01-15T00:00:00.000Z
- App decrypts file with hash received to reveal a script and media files
- App executes script with instructions to send email with attachments that were also decrypted (change this action for whatever you need)
- App deletes decrypted content and shuts down (optional)

You can get creative and might be able to compromise on certain steps depending on your treat model. This is very helpful for inheritance purposes if there happens to be
something sensitive you wish to share such as the location of your BIP 39 seed phrase backup along with other detailed instructions.
