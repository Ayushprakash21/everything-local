# Regulatory & Legal Compliance — Indian Pharmaceutical Framework

## 1. Statutory Legislation Overview

The Everything Local Pharmacy & Medical Ecosystem complies with key Indian pharmaceutical laws, notifications, and retail pharmacy regulations:

1. **Drugs and Cosmetics Act, 1940 & Drugs and Cosmetics Rules, 1945**:
   - Governs the import, manufacture, distribution, and sale of allopathic, homeopathic, and herbal medicines.
   - Mandates sale of prescription drugs under the personal supervision of a Registered Pharmacist.
2. **Pharmacy Act, 1948**:
   - Regulates the profession of pharmacy. Only individuals registered under Chapter IV of the Act (Registered Pharmacists) can compound, prepare, mix, or dispense medicines upon prescription.
3. **Information Technology Act, 2000 & SPDI Rules, 2011**:
   - Sensitive Personal Data or Information (SPDI) standards applied to patient medical records and electronic prescription images.
4. **Telemedicine Practice Guidelines, 2020** (Board of Governors, in supersession of Medical Council of India):
   - Outlines legitimate digital prescriptions, required practitioner identifiers, and permitted medicine lists.

---

## 2. Drug Schedules Implemented

| Schedule | Legal Description | Platform Handling |
| :--- | :--- | :--- |
| **OTC (Over-The-Counter)** | Household remedies, antacids, multivitamins, paracetamol 500mg, antiseptics, oral rehydration salts. | Permitted for immediate cart checkout without prescription upload. Standard batch & expiry tracked. |
| **Schedule H** | Antibiotics, antihypertensives, antidiabetics, cardiac medications. Contains statutory **Red Warning Rx** box. | **Prescription Mandatory**. Cannot checkout directly. Upload must be inspected and approved by a Registered Pharmacist. |
| **Schedule H1** | 3rd/4th generation antibiotics, anti-tubercular drugs, habit-forming psychotropics (e.g. Alprazolam, Tramadol). | **Prescription Mandatory** + dedicated dispensing register recording patient name, prescriber details, and quantity dispensed. Maintained for 3 years. |
| **Schedule X** | Narcotics, barbiturates, amphetamines, and potent mind-altering substances. | **Prohibited from Online Sale**. System automatically blocks search/ordering with statutory message. |
| **Medical Devices** | Blood pressure monitors, glucometers, nebulizers, thermometers. | Regulated medical equipment; direct checkout permitted with warranty and calibration details. |
| **First Aid & Essentials** | Bandages, surgical tape, gauze, antiseptic liquids. | Direct checkout permitted. |

---

## 3. Retail Drug Licences (Form 20 & Form 21)

Under Rules 59 and 61 of the Drugs and Cosmetics Rules, 1945:
- **Form 20**: Licence to sell, stock or exhibit or offer for sale, or distribute drugs other than those specified in Schedules C, C(1) and X.
- **Form 21**: Licence to sell, stock or exhibit or offer for sale, or distribute drugs specified in Schedules C and C(1) (biological and special products such as insulin, vaccines, sera).

In Everything Local:
- Every participating pharmacy store record holds verifiable Form 20 and Form 21 licence numbers (`licenceNumber`, `validFrom`, `validUntil`, `issuingAuthority`).
- Admin governance approves or suspends pharmacies based on state FDA inspection certificates.

---

## 4. Registered Pharmacist Supervision (Section 42, Pharmacy Act, 1948)

Section 42 of the Pharmacy Act, 1948 states:
> *"No person other than a registered pharmacist shall compound, prepare, mix, or dispense any medicine on the prescription of a medical practitioner."*

To enforce this:
1. Every licensed chemist store profile is linked to one or more verified **Registered Pharmacists**.
2. Pharmacists must have active registration with the **State Pharmacy Council** (e.g. Madhya Pradesh State Pharmacy Council - MPPC).
3. Ordinary store owners, inventory clerks, or delivery riders have zero access to clinical reviews or dispensing logs.
4. Each dispensing record permanently logs the `pharmacistRegistrationNumber` and `pharmacistName` on the statutory packaging slip.

---

## 5. Doctor Prescription Validity Checklist

Pharmacists follow a strict statutory checklist prior to approving any prescription:
- **Prescription Date**: Must not be older than 6 months from presentation.
- **RMP Identification**: Prescribing doctor's full name, medical qualification, and State / National Medical Commission (NMC) registration number.
- **Patient Particulars**: Patient name, age, and gender matching the customer order profile.
- **Clinical Details**: Medicine generic/brand name, strength, dosage form, frequency, and duration of therapy.
- **Physical/Digital Signature**: Legitimate signature and clinic stamp; photocopies with alterations or overwriting are rejected.
