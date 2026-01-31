import { generateId } from './helpers';
import { invoiceStorage, customerStorage, productStorage, businessStorage, settingsStorage } from './storage';

const MIGRATION_KEY = 'invoiceflow_uuid_migration_v1';

// Regex to check if a string is a valid UUID
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const isUUID = (id: string): boolean => {
    return UUID_REGEX.test(id);
};

export const migrateDataToUUID = () => {
    // Check if migration already ran
    if (localStorage.getItem(MIGRATION_KEY)) {
        return;
    }

    console.log('Starting migration to UUIDs...');
    let migratedCount = 0;

    // 1. Migrate Invoices
    try {
        const invoices = invoiceStorage.getAll();
        let invoicesChanged = false;

        const migratedInvoices = invoices.map(invoice => {
            let changed = false;
            let newId = invoice.id;

            // Migrate Invoice ID
            if (!isUUID(invoice.id)) {
                newId = generateId();
                changed = true;
            }

            // Migrate Item IDs
            const newItems = invoice.items.map(item => {
                if (!isUUID(item.id)) {
                    changed = true;
                    return { ...item, id: generateId() };
                }
                return item;
            });

            if (changed) {
                invoicesChanged = true;
                migratedCount++;
                return { ...invoice, id: newId, items: newItems };
            }
            return invoice;
        });

        if (invoicesChanged) {
            localStorage.setItem('invoiceflow_invoices', JSON.stringify(migratedInvoices));
        }
    } catch (e) {
        console.error('Error migrating invoices:', e);
    }

    // 2. Migrate Customers
    try {
        const customers = customerStorage.getAll();
        let customersChanged = false;

        const migratedCustomers = customers.map(customer => {
            if (!isUUID(customer.id)) {
                customersChanged = true;
                migratedCount++;
                return { ...customer, id: generateId() };
            }
            return customer;
        });

        if (customersChanged) {
            localStorage.setItem('invoiceflow_customers', JSON.stringify(migratedCustomers));
        }
    } catch (e) {
        console.error('Error migrating customers:', e);
    }

    // 3. Migrate Products
    try {
        const products = productStorage.getAll();
        let productsChanged = false;

        const migratedProducts = products.map(product => {
            if (!isUUID(product.id)) {
                productsChanged = true;
                migratedCount++;
                return { ...product, id: generateId() };
            }
            return product;
        });

        if (productsChanged) {
            localStorage.setItem('invoiceflow_products', JSON.stringify(migratedProducts));
        }
    } catch (e) {
        console.error('Error migrating products:', e);
    }

    // 4. Migrate Business Profile
    try {
        const business = businessStorage.get();
        if (business && business.id && !isUUID(business.id)) {
            // Business usually upserted by user_id but let's fix the ID if present
            const newBusiness = { ...business, id: generateId() };
            localStorage.setItem('invoiceflow_business', JSON.stringify(newBusiness));
            migratedCount++;
        }
    } catch (e) {
        console.error('Error migrating business:', e);
    }

    // 5. Migrate Settings
    try {
        const settings = settingsStorage.get();
        if (settings && settings.id && !isUUID(settings.id)) {
            const newSettings = { ...settings, id: generateId() };
            localStorage.setItem('invoiceflow_settings', JSON.stringify(newSettings));
            migratedCount++;
        }
    } catch (e) {
        console.error('Error migrating settings:', e);
    }

    // Mark migration as done
    localStorage.setItem(MIGRATION_KEY, 'true');
    console.log(`Migration complete. Migrated ${migratedCount} items.`);
};
