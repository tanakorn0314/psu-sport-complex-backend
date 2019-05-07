import { IsString, IsNumber, IsDateString } from 'class-validator';
import { Transaction } from '../model/transaction.model';

export class TransactionDTO {
    @IsString() account: string;
    @IsNumber() deposit: number;
    @IsDateString() date: Date;
    @IsString() tid: String;

    static toModel(dto: TransactionDTO): Transaction {
        const {
            account,
            deposit,
            date,
            tid
        } = dto;
        
        const model = {
            account,
            deposit,
            date,
            tid
        } as Transaction;

        return model;
    }
}