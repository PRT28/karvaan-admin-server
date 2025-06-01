export type Permissions = {
    sales: {
        create: boolean,
        read: boolean,
        delete: boolean,
        update: boolean
    },
    operateions: {
        voucher: {
            create: boolean,
            read: boolean,
            delete: boolean,
            update: boolean
        },
        content: {
            create: boolean,
            read: boolean,
            delete: boolean,
            update: boolean
        }
    },
    userAccess: {
        roles: {
            create: boolean,
            read: boolean,
            delete: boolean,
            update: boolean
        },
        user: {
            create: boolean,
            read: boolean,
            delete: boolean,
            update: boolean
        }
    }
}