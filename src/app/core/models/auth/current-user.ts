export interface CurrentUser {
    username: string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    userId?: number;
}
