// import api from "../apiClient";

// const API_URL = "/crm-persons";
// const CONTACTS_API_URL = "/crm-contacts";

// // ✅ Create a new contact for a customer
// export const createCustomerContact = async (contactData: any) => {
//   try {
//     const response = await api.post(API_URL, contactData);
//     return response.data;
//   } catch (error: any) {
//     console.error("Failed to create contact:", error.response?.data || error);
//     throw error;
//   }
// };

// // ✅ Get all contacts for a specific customer or branch
// export const getCustomerContacts = async (branchId: string | number) => {
//   console.log(`==========================================`);
//   console.log(`Fetching contacts for branch ID: ${branchId}`);
  
//   if (!branchId) {
//     console.warn("No branch ID provided to getCustomerContacts");
//     return [];
//   }
  
//   try {
//     // Step 1: Get ALL contacts from the API to analyze
//     const allContactsResponse = await api.get(CONTACTS_API_URL);
//     console.log(`Total contacts in system: ${allContactsResponse.data.length}`);
    
//     // Step 2: Filter contacts by exact entity_id match with branchId (converted to string)
//     const branchIdStr = String(branchId);
//     const branchContacts = allContactsResponse.data.filter(
//       (contact: any) => String(contact.entity_id) === branchIdStr
//     );
    
//     console.log(`Found ${branchContacts.length} contacts for branch ${branchId}:`);
//     branchContacts.forEach((contact: any, index: number) => {
//       console.log(`  Contact ${index + 1}: id=${contact.id}, person_id=${contact.person_id}, entity_id=${contact.entity_id}`);
//     });
    
//     if (branchContacts.length === 0) {
//       console.warn(`No contacts found for branch ID: ${branchId}`);
//       return [];
//     }
    
//     // Step 3: Extract person IDs and make separate requests for each
//     const personDetails = [];
//     for (const contact of branchContacts) {
//       try {
//         // Make a direct request for this specific person
//         console.log(`Fetching details for person_id=${contact.person_id}`);
//         const personResponse = await api.get(`${API_URL}/${contact.person_id}`);
        
//         if (personResponse.data) {
//           console.log(`  Found person: id=${personResponse.data.id}, ref=${personResponse.data.ref}, name=${personResponse.data.name}`);
//           personDetails.push({
//             ...personResponse.data,
//             contact_id: contact.id,
//             contact_type: contact.type
//           });
//         } else {
//           console.warn(`  No data found for person_id=${contact.person_id}`);
//         }
//       } catch (personError) {
//         console.error(`  Failed to fetch person_id=${contact.person_id}:`, personError.message);
//       }
//     }
    
//     console.log(`Retrieved ${personDetails.length} person records for branch ${branchId}`);
//     console.log(`==========================================`);
    
//     return personDetails;
//   } catch (error: any) {
//     console.error(`Failed to fetch contacts for branch ${branchId}:`, error.message || error);
//     return [];
//   }
// };

// // ✅ Update a contact
// export const updateCustomerContact = async (id: string | number, contactData: any) => {
//   try {
//     const response = await api.put(`${API_URL}/${id}`, contactData);
//     return response.data;
//   } catch (error: any) {
//     console.error("Failed to update contact:", error.response?.data || error);
//     throw error;
//   }
// };

// // ✅ Delete a contact
// export const deleteCustomerContact = async (id: string | number) => {
//   try {
//     const response = await api.delete(`${API_URL}/${id}`);
//     return response.data;
//   } catch (error: any) {
//     console.error("Failed to delete contact:", error.response?.data || error);
//     throw error;
//   }
// };

