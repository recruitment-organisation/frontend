export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    username: string;
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    userId?: number;
    companyId?: number;
    companyName?: string;
}
