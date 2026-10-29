export const VENDOR_SERVICE_ROUTES = {
    list: '/partner/service-list',
    create: '/partner/add-service',
    edit: (id) => `/partner/edit-service/${encodeURIComponent(id)}`,
};
