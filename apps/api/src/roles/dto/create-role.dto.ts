export class CreateRoleDto {
    name: string;
    level: number;
    description?: string;
    permissionIds?: string[];
}
