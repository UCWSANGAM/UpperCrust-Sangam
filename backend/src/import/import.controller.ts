import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ImportService } from './import.service';
import { Roles } from '../rbac/roles.decorator';
import { RolesGuard } from '../rbac/roles.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME = [
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
];

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('import')
export class ImportController {
  constructor(private importService: ImportService, private prisma: PrismaService) {}

  // Only admin-tier roles can bulk-import client data
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.OPERATIONS)
  @Post('investor-list')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async importInvestorList(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    this.validateFile(file);
    const result = await this.importService.importInvestorList(file.buffer, user.id);
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'IMPORT_INVESTOR_LIST',
        entity: 'Investor',
        metadata: result,
      },
    });
    return result;
  }

  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.OPERATIONS)
  @Post('folio-report')
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: MAX_FILE_SIZE } }))
  async importFolioReport(
    @UploadedFile() file: Express.Multer.File,
    @CurrentUser() user: { id: string },
  ) {
    this.validateFile(file);
    const result = await this.importService.importFolioReport(file.buffer);
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'IMPORT_FOLIO_REPORT',
        entity: 'Folio',
        metadata: result,
      },
    });
    return result;
  }

  private validateFile(file: Express.Multer.File) {
    if (!file) throw new BadRequestException('No file uploaded');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('Only .xlsx or .xls files are allowed');
    }
  }
}
