import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { Booking } from './model/booking.model';
import { Sequelize } from 'sequelize-typescript';
import TimeUtils from '../common/utils/time-utils';
import { User } from 'src/user/model/user.model';
import { Court } from 'src/court/model/court.model';
import { BOOKING_STATUS } from './constant/booking-status';

@Injectable()
export class BookingService {
  constructor(
    @Inject('bookingRepo') private readonly booking: typeof Booking) { }

  async findAll() {
    return await this.booking.findAll();
  }

  async findById(bookingId: number) {
    return await this.booking.findOne({
      include: [Court, User],
      where: { bookingId }
    });
  }

  async findByUserId(userId: number) {
    return await this.booking.findAll({
      include: [Court, User],
      where: { userId }
    });
  }

  async findCurrentWeek() {
    const Op = Sequelize.Op;
    const todayZOclock = TimeUtils.zeroOclock(new Date());
    const dayNextWeekZOclock = TimeUtils.zeroOclock(TimeUtils.nextXDate(new Date(), 7));

    const bookings = await this.booking.findAll({
      include: [User, Court],
      where: {
        endDate: {
          [Op.between]: [
            todayZOclock,
            dayNextWeekZOclock
          ]
        }
      },
      order: [['startDate']]
    });

    return bookings;
  }

  async uploadSlip(bookingId: number, filename) {
    const booking = await this.booking.findByPk(bookingId);
    if (!booking)
      return 'booking not found';

    booking.slip = filename;
    booking.status = BOOKING_STATUS.PAID;

    return await booking.update(booking);
  }

  async approve(bookingId: number, isApprove: boolean) {
    const booking = await this.booking.findByPk(bookingId);
    if (!booking)
      return 'booking not found'

    booking.status = isApprove ? BOOKING_STATUS.APPROVED : BOOKING_STATUS.UNAPPROVED;

    return await booking.update(booking);
  }

  async book(data: Booking) {
    const { startDate, endDate } = data;
    if (startDate > endDate)
      return 'start date lead end date';

    const overlapBooking = await this.findOverlapBooking(startDate, endDate);
    if (overlapBooking.length > 0)
      return 'overlap booking';

    const booking = await this.booking.create(data);
    return booking;
  }

  private async findOverlapBooking(startDate: Date, endDate: Date) {
    const Op = Sequelize.Op;
    const bookings = await this.booking.findAll({
      where: {
        [Op.or]: [
          {
            startDate: {
              [Op.gte]: startDate,
              [Op.lt]: endDate
            }
          },
          {
            endDate: {
              [Op.gt]: startDate,
              [Op.lte]: endDate
            }
          }
        ]
      }
    });
    return bookings;
  }
}