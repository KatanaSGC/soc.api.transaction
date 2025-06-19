import { IsNotEmpty } from "class-validator";

export class FindAllTransactionQuery 
{
    @IsNotEmpty()
    Username: string;

    constructor(username: string) {
        this.Username = username;
    }
}