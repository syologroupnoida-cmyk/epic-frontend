export const VENDOR_SERVICE_ROUTES = {
    list: '/agent/service-list',
    create: '/agent/add-service',
    edit: (id) => `/agent/edit-service/${encodeURIComponent(id)}`,
};
