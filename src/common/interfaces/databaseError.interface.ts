export interface DatabaseError {
    code: string;
    detail?: string;
    constraint?: string;
    table?: string;
    name?: string;
}