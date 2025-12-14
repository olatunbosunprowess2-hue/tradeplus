import { Controller, Get, Post, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard, RequireRole } from '../common/guards/roles.guard';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    /**
     * Get all roles in the system
     * Accessible by: super_admin, admin
     */
    @Get()
    @RequireRole('admin')
    findAll() {
        return this.rolesService.findAll();
    }

    /**
     * Get a specific role by ID
     * Accessible by: super_admin, admin
     */
    @Get(':id')
    @RequireRole('admin')
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(id);
    }

    /**
     * Get all team members (users with admin roles)
     * Accessible by: super_admin, admin
     */
    @Get('team/members')
    @RequireRole('admin')
    getTeamMembers(@Query('includeRegularAdmins') includeRegularAdmins?: string) {
        return this.rolesService.getTeamMembers(includeRegularAdmins === 'true');
    }

    /**
     * Create a new role
     * Accessible by: super_admin only
     */
    @Post()
    @RequireRole('super_admin')
    create(@Body() createRoleDto: CreateRoleDto, @Request() req) {
        return this.rolesService.create(createRoleDto, req.user?.id);
    }

    /**
     * Assign a role to a user
     * Accessible by: super_admin, admin (with hierarchy restrictions)
     */
    @Post('assign')
    @RequireRole('admin')
    assignRole(@Body() body: { userId: string; roleId?: string }, @Request() req) {
        return this.rolesService.assignRole(body.userId, body.roleId, req.user?.id);
    }

    /**
     * Remove a user's role (set to regular user)
     * Accessible by: super_admin, admin (with hierarchy restrictions)
     */
    @Post('remove')
    @RequireRole('admin')
    removeRole(@Body() body: { userId: string }, @Request() req) {
        return this.rolesService.assignRole(body.userId, null, req.user?.id);
    }
}

