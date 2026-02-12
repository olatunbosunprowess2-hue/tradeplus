import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { CommunityPostsService } from './community-posts.service';
import { CreatePostDto, UpdatePostDto, CreateCommentDto, CreatePostOfferDto, QueryPostsDto } from './dto/community-posts.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('community-posts')
export class CommunityPostsController {
    constructor(private readonly postsService: CommunityPostsService) { }

    // ==================
    // PUBLIC FEED
    // ==================
    @Get()
    findAll(@Query() query: QueryPostsDto) {
        return this.postsService.findAll(query);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.postsService.findOne(id);
    }

    // ==================
    // AUTH REQUIRED
    // ==================
    @UseGuards(JwtAuthGuard)
    @Post()
    create(@Request() req, @Body() dto: CreatePostDto) {
        return this.postsService.create(req.user.id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Get('user/my-posts')
    findMyPosts(@Request() req, @Query('page') page?: number, @Query('limit') limit?: number) {
        return this.postsService.findMyPosts(req.user.id, page, limit);
        return this.postsService.findMyPosts(req.user.id, page, limit);
    }

    @UseGuards(JwtAuthGuard)
    @Get('me/saved-ids')
    getSavedIds(@Request() req) {
        return this.postsService.getSavedPostIds(req.user.id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/save')
    savePost(@Request() req, @Param('id') id: string) {
        return this.postsService.savePost(req.user.id, id);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id/save')
    unsavePost(@Request() req, @Param('id') id: string) {
        return this.postsService.unsavePost(req.user.id, id);
    }

    @UseGuards(JwtAuthGuard)
    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() dto: UpdatePostDto) {
        return this.postsService.update(req.user.id, id, dto);
    }

    @UseGuards(JwtAuthGuard)
    @Delete(':id')
    remove(@Request() req, @Param('id') id: string) {
        return this.postsService.remove(req.user.id, id);
    }

    // ==================
    // COMMENTS
    // ==================
    @Get(':id/comments')
    getComments(@Param('id') id: string) {
        return this.postsService.getComments(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/comments')
    addComment(@Request() req, @Param('id') id: string, @Body() dto: CreateCommentDto) {
        return this.postsService.addComment(req.user.id, id, dto);
    }

    // ==================
    // OFFERS
    // ==================
    @Get(':id/offers')
    getOffers(@Param('id') id: string) {
        return this.postsService.getOffers(id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/offers')
    makeOffer(@Request() req, @Param('id') id: string, @Body() dto: CreatePostOfferDto) {
        return this.postsService.makeOffer(req.user.id, id, dto);
    }
}
