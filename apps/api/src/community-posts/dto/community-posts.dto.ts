import { IsString, IsOptional, IsArray, MaxLength, IsIn } from 'class-validator';

export class CreatePostDto {
    @IsString()
    @MaxLength(2000)
    content: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    hashtags?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];
}

export class UpdatePostDto {
    @IsString()
    @MaxLength(2000)
    @IsOptional()
    content?: string;

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    hashtags?: string[];

    @IsArray()
    @IsString({ each: true })
    @IsOptional()
    images?: string[];

    @IsOptional()
    @IsString()
    @IsIn(['active', 'resolved'])
    status?: string;
}

export class CreateCommentDto {
    @IsString()
    @MaxLength(1000)
    content: string;
}

export class CreatePostOfferDto {
    @IsString()
    @MaxLength(1000)
    message: string;
}

export class QueryPostsDto {
    @IsOptional()
    @IsString()
    search?: string;

    @IsOptional()
    page?: number;

    @IsOptional()
    limit?: number;
}
