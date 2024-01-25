const { Contract } = require('fabric-contract-api');
class assetTransfer extends Contract {
    async initLedger(ctx) {
        console.info('============= START : Initialize Ledger ===========');
        console.info('============= END : Initialize Ledger ===========');
    }
    
 async registerPatient(ctx, patientId, name, age,data) {
    console.info('============= START : Register Patient ===========');

    // Check if the patient already exists
    const existingPatient = await ctx.stub.getState(patientId);
    if (existingPatient && existingPatient.length > 0) {
        throw new Error(`Patient with ID ${patientId} already exists.`);
    }

    // Get the identity of the patient (owner)
    const patientOwner = ctx.clientIdentity.getID();

    // Create a new patient object
    const newPatient = {
        patientId,
        name,
        age,
        data,
        consent: false, // Initial consent status is set to false
        owner: patientOwner // Set the owner to the patient's identity
    };

    // Update the ledger with the new patient data
    await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(newPatient)));

    console.info('============= END : Register Patient ===========');
}
    async getPatientData(ctx, patientId) {
        console.info('============= START : Get Patient Data ===========');

        const existingPatient = await ctx.stub.getState(patientId);
        if (!existingPatient || existingPatient.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist.`);
        }

        console.info('============= END : Get Patient Data ===========');
        return existingPatient.toString();
    }
    async getAllPatients(ctx) {
        console.info('============= START : Get All Patients ===========');

        const iterator = await ctx.stub.getStateByRange('', ''); // Get all patients

        const allPatients = [];

        while (true) {
            const result = await iterator.next();

            if (result.value && result.value.value.toString()) {
                const patientData = JSON.parse(result.value.value.toString());
                allPatients.push(patientData);
            }

            if (result.done) {
                await iterator.close();
                console.info('============= END : Get All Patients ===========');
                return JSON.stringify(allPatients);
            }
        }
    }
    async getPatientsWithConsent(ctx) {
        console.info('============= START : Get Patients with Consent ===========');
    
        const iterator = await ctx.stub.getStateByRange('', ''); // Get all patients
    
        const patientsWithConsent = [];
    
        while (true) {
            const result = await iterator.next();
    
            if (result.value && result.value.value.toString()) {
                const patientData = JSON.parse(result.value.value.toString());
    
                // Check if the patient has given consent
                if (patientData.consent) {
                    // Include patient data in the result
                    patientsWithConsent.push(patientData);
                }
            }
    
            if (result.done) {
                await iterator.close();
                console.info('============= END : Get Patients with Consent ===========');
                
                // Return the result as a JSON string
                return JSON.stringify(patientsWithConsent);
            }
        }
    }

    async revokeConsent(ctx, patientId) {
        console.info('============= START : Revoke Consent ===========');

        // Get the identity of the entity invoking the chaincode
        const invokerIdentity = ctx.clientIdentity.getID();

        // Check if the patient exists
        const existingPatient = await ctx.stub.getState(patientId);
        if (!existingPatient || existingPatient.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist. Register the patient first.`);
        }

        const patientData = JSON.parse(existingPatient.toString());

        // Check if the invoker is the owner of the patient record
        if (patientData.owner !== invokerIdentity) {
            throw new Error(`Only the patient can revoke consent for ID ${patientId}.`);
        }

        // Check if the patient has already revoked consent
        if (!patientData.consent) {
            throw new Error(`Patient with ID ${patientId} has not given consent.`);
        }

        // Update the patient data to indicate revoked consent
        patientData.consent = false;

        // Update the ledger with the modified patient data
        await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patientData)));

        console.info('============= END : Revoke Consent ===========');
    }

    async checkConsent(ctx, patientId) {
        console.info('============= START : Check Consent ===========');

        // Get the patient data from the ledger
        const existingPatient = await ctx.stub.getState(patientId);
        if (!existingPatient || existingPatient.length === 0) {
            throw new Error(`Patient with ID ${patientId} does not exist.`);
        }

        const patientData = JSON.parse(existingPatient.toString());

        // Return the current consent status
        const consentStatus = patientData.consent;

        console.info('============= END : Check Consent ===========');
        return consentStatus;
    }

async giveConsent(ctx, patientId) {
    console.info('============= START : Give Consent ===========');

    // Get the identity of the entity invoking the chaincode
    const invokerIdentity = ctx.clientIdentity.getID();

    // Check if the patient exists
    const existingPatient = await ctx.stub.getState(patientId);
    if (!existingPatient || existingPatient.length === 0) {
        throw new Error(`Patient with ID ${patientId} does not exist. Register the patient first.`);
    }

    const patientData = JSON.parse(existingPatient.toString());

    // Check if the invoker is the owner of the patient record
    if (patientData.owner !== invokerIdentity) {
        throw new Error(`Only the patient can give consent for ID ${patientId}.`);
    }

    // Check if the patient has already given consent
    if (patientData.consent) {
        throw new Error(`Patient with ID ${patientId} has already given consent.`);
    }

    // Update the patient data to indicate consent
    patientData.consent = true;

    // Update the ledger with the modified patient data
    await ctx.stub.putState(patientId, Buffer.from(JSON.stringify(patientData)));
    
    console.info('============= END : Give Consent ===========');
}

async deleteAllPatients(ctx) {
    console.info('============= START : Delete All Patients ===========');

    const iterator = await ctx.stub.getStateByRange('', ''); // Get all patients

    while (true) {
        const result = await iterator.next();

        if (result.value && result.value.value.toString()) {
            const patientId = result.value.key;

            // Delete the patient record from the ledger
            await ctx.stub.deleteState(patientId);

            console.info(`Deleted patient with ID ${patientId}`);
        }

        if (result.done) {
            await iterator.close();
            console.info('============= END : Delete All Patients ===========');
            return 'All patients deleted successfully.';
        }
    }
}
async getConsentedPatientsBetweenAges(ctx, minAge, maxAge) {
    console.info('============= START : Get Consented Patients Between Ages ===========');

    const iterator = await ctx.stub.getStateByRange('', ''); // Get all patients

    const consentedPatientsBetweenAges = [];

    while (true) {
        const result = await iterator.next();

        if (result.value && result.value.value.toString()) {
            const patientData = JSON.parse(result.value.value.toString());

            // Check if the patient has given consent and is within the specified age range
            if (patientData.consent && patientData.age >= minAge && patientData.age <= maxAge) {
                // Include patient data in the result
                consentedPatientsBetweenAges.push(patientData);
            }
        }

        if (result.done) {
            await iterator.close();
            console.info('============= END : Get Consented Patients Between Ages ===========');

            // Return the result as a JSON string
            return JSON.stringify(consentedPatientsBetweenAges);
        }
    }
    
}

   
} module.exports = assetTransfer