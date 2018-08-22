export interface AbstractCommand  {
    process(argv: any): Promise<any>;
}
