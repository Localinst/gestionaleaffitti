declare module 'exceljs' {
  export class Workbook {
    addWorksheet(name?: string, options?: any): Worksheet;
    xlsx: {
      writeBuffer(): Promise<Buffer>;
    };
  }
  
  export class Worksheet {
    columns: any[];
    addRow(data: any[]): any;
    getCell(address: string): {
      value: any;
      style: any;
    };
    eachRow(callback: (row: any, rowNumber: number) => void): void;
  }
  
  export default {
    Workbook,
    Worksheet
  };
} 