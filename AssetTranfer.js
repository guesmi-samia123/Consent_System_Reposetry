'use strict'

const { Contract } = require('fabric-contract-api');
class AssetTranfer extends Contract {

    async initLedger(ctx) {                      
        const consent = {                
                   ID: '01',
                   Name: 'Mark',
                   Surname: 'Test',
                   IDCard: '123456789ascd',
                   Issuer: 'TestState',
                   Project: 'ABC',
                   Status: '1' // 1 = yes, 0 = revoked
               }
        await ctx.stub.putState(consent.ID, Buffer.from(JSON.stringify(consent))); 
    }

    async getConsent(ctx, _id){
        const consentJSON = await ctx.stub.getState(_id);        
        return consentJSON.toString();  
    }

    async consentExists(ctx, id) {
        const assetJSON = await ctx.stub.getState(id);
        return assetJSON && assetJSON.length > 0;
    }
    
    // CreateAsset issues a new asset to the world state with given details.
    async createConsent(ctx, id, name, surname, idCard, issuer, project, status) {
        const exists = await this.consentExists(ctx, id);
        if (exists) {
            console.log('RECORD ALREADY EXISTS!');
            throw new Error(`The Consent ${id} already exists`);
        }

        const newConsent = {
            ID: id,
            Name: name,
            Surname: surname,
            IDCard: idCard,
            Issuer: issuer,
            Project: project,
            Status: status
        };

        const consentBuffer = Buffer.from(JSON.stringify(newConsent));
        ctx.stub.setEvent('CreateConsent', consentBuffer);

        await ctx.stub.putState(id, consentBuffer);
        console.log('RECORD ADDED TO THE LEDGER SUCCESSFULLY!');
        return JSON.stringify(newConsent);
    }


    // GetAllAssets returns all consents found in the world state.
    async getAllConsents(ctx) {
        const allResults = [];
        // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
        const iterator = await ctx.stub.getStateByRange('', '');
        let result = await iterator.next();
        while (!result.done) {
            const strValue = Buffer.from(result.value.value.toString()).toString('utf8');
            let record;
            try {
                record = JSON.parse(strValue);
            } catch (err) {
                console.log(err);
                record = strValue;
            }
            allResults.push(record);
            result = await iterator.next();
        }
        return JSON.stringify(allResults);
    }

    // DeleteAsset deletes an given asset from the world state.
    async deleteConsent(ctx, id) {
        const exists = await this.consentExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
            const consent = await ctx.stub.getState(id);
        const consentBuffer = Buffer.from(JSON.stringify(consent));
        ctx.stub.setEvent('deleteConsent', consentBuffer);
        return ctx.stub.deleteState(id);
    }

    // UpdateAsset updates an existing asset in the world state with provided parameters.
    async updateConsent(ctx, id, status) {
        const exists = await this.consentExists(ctx, id);
        if (!exists) {
            throw new Error(`The asset ${id} does not exist`);
        }
        const rawAsset = await ctx.stub.getState(id);
        const asset = JSON.parse(rawAsset.toString());
        asset.Status = status;
        const assetBuffer = Buffer.from(JSON.stringify(asset));
        ctx.stub.setEvent('updateConsent', assetBuffer);
        return ctx.stub.putState(id, assetBuffer);
    }
}
module.exports = AssetTranfer
