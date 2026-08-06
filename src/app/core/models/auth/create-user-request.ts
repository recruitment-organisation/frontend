export interface CreateUserRequest {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    location?: string;
    available?: boolean;
    linkedinUrl?: string;
    githubUrl?: string;
}
