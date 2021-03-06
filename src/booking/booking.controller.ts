import {
  Controller,
  Get,
  Post,
  Res,
  Body,
  UsePipes,
  UseGuards,
  Param,
  ParseIntPipe,
  Patch,
  Req,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingDTO } from './dto/booking.dto';
import { ValidationPipe } from '../common/validation.pipe';
import { AuthGuard } from '@nestjs/passport';
import { extractToken } from '../common/utils/extract-token';
import { AuthService } from '../authen/auth.service';

@Controller('booking')
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly authService: AuthService
  ) { }

  @Get('/all')
  async findAll(@Res() res) {
    const result = await this.bookingService.findAll();
    return res.status(HttpStatus.OK).json(result);
  }

  @Get('/stadium/:stadiumId')
  async findByStadium(@Res() res, @Param('stadiumId') id) {
    const result = await this.bookingService.findByStadiumId(id);
    return res.status(HttpStatus.OK).json(result);
  }

  @UseGuards(AuthGuard())
  @UsePipes(new ParseIntPipe())
  @Get('/id/:bookingId')
  async findById(@Res() res, @Param('bookingId') id) {
    const result = await this.bookingService.findById(id);
    return res.status(HttpStatus.OK).json(result);
  }

  @UseGuards(AuthGuard())
  @UsePipes(new ParseIntPipe())
  @Get('/user/:userId')
  async findByUserId(@Res() res, @Param('userId') userId) {
    const result = await this.bookingService.findByUserId(userId);
    return res.status(HttpStatus.OK).json(result);
  }

  @UseGuards(AuthGuard())
  @Get('/')
  async findCurrentWeek(@Res() res) {
    const result = await this.bookingService.findCurrentWeek();
    return res.status(HttpStatus.OK).json(result);
  }

  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe())
  @Post('/')
  async book(@Body() dtos: BookingDTO[], @Req() req, @Res() res) {
    const bookingModels = dtos.map(dto => (BookingDTO.toModel(dto)));
    const user = await this.authService.validateToken(extractToken(req));
    const result = await this.bookingService.bookMany(user.position, bookingModels);
    return res.status(HttpStatus.OK).json(result);
  }

  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe())
  @Post('/admin')
  async bookAdmin(@Body() dtos: BookingDTO[], @Res() res) {
    const bookingModels = dtos.map(dto => (BookingDTO.toModel(dto)));
    const result = await this.bookingService.bookByAdmin(bookingModels);
    return res.status(HttpStatus.OK).json(result);
  }

  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe())
  @Patch('/:bookingId')
  async updateBooking(@Param('bookingId') bookingId, @Body() dto: BookingDTO, @Res() res) {
    const result = await this.bookingService.update(bookingId, BookingDTO.toModel(dto));
    return res.status(HttpStatus.OK).json(result);
  }

  @UseGuards(AuthGuard())
  @UsePipes(new ValidationPipe())
  @Patch('/approve/:bookingId')
  async approve(@Param('bookingId') bookingId, @Req() req, @Res() res) {
    await this.authService.checkAdminFromToken(extractToken(req));

    const result = await this.bookingService.approve(bookingId);
    return res.status(HttpStatus.OK).json(result);
  }

  @UsePipes(new ValidationPipe())
  @Delete('/:bookingId')
  async deleteById(@Param('bookingId') bookingId,@Req() req, @Res() res) {
    const booking = await this.bookingService.findById(bookingId);
    if (!booking)
      return res.status(HttpStatus.OK).json({error: 'Booking not found'})

    await this.authService.checkOwnerFromToken(extractToken(req), booking);
    const result = await this.bookingService.deleteById(bookingId);

    return res.status(HttpStatus.OK).json(result);
  }

  @UsePipes(new ValidationPipe())
  @Delete('/bill/:billId')
  async deleteByBillId(@Param('billId') billId,@Req() req, @Res() res) {
    const bookings = await this.bookingService.findByBillId(billId);
    if (!bookings || bookings.length === 0)
      return res.status(HttpStatus.OK).json({error: 'Booking not found'})

    await this.authService.checkOwnerFromToken(extractToken(req), bookings[0]);
    const result = await this.bookingService.deleteByBillId(billId);

    return res.status(HttpStatus.OK).json(result);
  }

}
