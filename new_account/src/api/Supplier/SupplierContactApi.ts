import api from "../apiClient";

const API_URL = "/crm-persons";

//  Create a new contact for a Supplier
export const createSupplierContact = async (contactData: any) => {
  try {
    const response = await api.post(API_URL, contactData);
    return response.data;
  } catch (error: any) {
    console.error("Failed to create contact:", error.response?.data || error);
    throw error;
  }
};

//  Get all contacts for a specific Supplier
// Get contacts for a specific supplier
export const getSupplierContacts = async (supplierId: string | number) => {
  try {
    // Return empty if no supplierId provided
    if (!supplierId) return [];

    // 1. Fetch contacts for this supplier only
    const contactsResponse = await api.get("/crm-contacts", {
      params: { entity_id: supplierId, action: "supplier" },
    });
    const crmContacts = contactsResponse.data;

    if (crmContacts.length === 0) return [];

    // 2. Fetch all related person details
    const personIds = crmContacts.map((c: any) => c.person_id);
    const personsResponse = await api.get("/crm-persons", {
      params: { ids: personIds.join(",") },
    });
    const crmPersons = personsResponse.data;

    // 3. Fetch all relevant contact categories
    const typeIds = crmContacts.map((c: any) => c.type);
    const categoriesResponse = await api.get("/crm-categories", {
      params: { ids: Array.from(new Set(typeIds)).join(","), type: "supplier" }, // unique IDs only, only supplier categories
    });
    const contactCategories = categoriesResponse.data;

    // Build a map: type ID → description
    const categoryMap: { [key: number]: string } = {};
    contactCategories.forEach((cat: any) => {
      if (cat.type === "supplier") {
        categoryMap[cat.id] = cat.description;
      }
    });

    // Get a list of category IDs that have type="supplier"
    const supplierCategoryIds = contactCategories
      .filter((cat: any) => cat.type === "supplier")
      .map((cat: any) => cat.id);

    // 4. Merge contact + person + category info
    const merged = crmContacts
      // ensure contacts are for this supplier entity and use supplier categories
      .filter((contact: any) => contact.entity_id == supplierId)
      .filter((contact: any) => supplierCategoryIds.includes(contact.type) || supplierCategoryIds.length === 0)
      .map((contact: any) => {
      const person = crmPersons.find((p: any) => p.id === contact.person_id);
      let firstName = "";
      let lastName = "";
      if (person?.name) {
        const parts = person.name.split(" ");
        firstName = parts[0];
        lastName = parts.slice(1).join(" ");
      }

      return {
        id: contact.id,
        reference: person?.ref || "",
        assignment: categoryMap[contact.type] || "Unknown",
        name: person?.name || `${firstName} ${lastName}`.trim(),
        firstName,
        lastName,
        phone: person?.phone || "",
        phone2: person?.phone2 || "",
        fax: person?.fax || "",
        email: person?.email || "",
        inactive: contact.inactive || false,
      };
    });


    return merged;
  } catch (error: any) {
    console.error("Failed to fetch supplier contacts:", error.response?.data || error);
    return [];
  }
};



//  Update a contact
export const updateSupplierContact = async (id: string | number, contactData: any) => {
  try {
    const response = await api.put(`${API_URL}/${id}`, contactData);
    return response.data;
  } catch (error: any) {
    console.error("Failed to update contact:", error.response?.data || error);
    throw error;
  }
};

//  Delete a contact
export const deleteSupplierContact = async (id: string | number) => {
  try {
    const response = await api.delete(`${API_URL}/${id}`);
    return response.data;
  } catch (error: any) {
    console.error("Failed to delete contact:", error.response?.data || error);
    throw error;
  }
};


