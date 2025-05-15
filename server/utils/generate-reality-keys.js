const crypto = require('crypto');

function generateX25519KeyPair() {
    const { publicKey, privateKey } = crypto.generateKeyPairSync('x25519');
    
    const publicKeyBase64 = publicKey.export({
        type: 'spki',
        format: 'der'
    }).toString('base64');
    
    const privateKeyBase64 = privateKey.export({
        type: 'pkcs8',
        format: 'der'
    }).toString('base64');

    return {
        publicKey: publicKeyBase64,
        privateKey: privateKeyBase64
    };
}

const keyPair = generateX25519KeyPair();
console.log('Private Key:', keyPair.privateKey);
console.log('Public Key:', keyPair.publicKey); 