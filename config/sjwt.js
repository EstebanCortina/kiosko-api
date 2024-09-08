import {JWT_SECRET} from "./env.js";
import * as jose from 'jose'

export default class SJWT {
    static _instance;

    constructor() {
        if(this._isSingleton()){
            return SJWT._instance
        }
        SJWT._instance = this
        return SJWT._instance;
    }

    _isSingleton() {
        return !!SJWT._instance;
    }

    static async getJWT(payload, expirationTime) {
        const secret = jose.base64url.decode(SJWT._getSecret(JWT_SECRET))
        return await new jose.EncryptJWT(payload)
            .setProtectedHeader({ alg: 'dir', enc: 'A128CBC-HS256' })
            .setIssuedAt()
            .setIssuer('Kiosko-Feeds')
            .setAudience('Kiosko-Feeds-API')
            .setExpirationTime(expirationTime)
            .encrypt(secret)
    }

    static async decrypt(jwt) {
        const secret = jose.base64url.decode(SJWT._getSecret(JWT_SECRET))
        const {payload} = await jose.jwtDecrypt(jwt, secret, {
            issuer: "Kiosko-Feeds",
            audience: "Kiosko-Feeds-API",
        })
        return payload
    }

    static _getSecret(secretWord) {
        return (
            jose.base64url.encode(
                new TextEncoder().encode(secretWord)
            )
        )
    }
}