declare module 'exceljs' {
  export class Workbook {
    addWorksheet(name?: string, options?: any): Worksheet;
    xlsx: {
      writeBuffer(): Promise<Buffer>;
    };
    creator: string;
    lastModifiedBy: string;
    created: Date;
    modified: Date;
  }
  
  export class Worksheet {
    columns: any[];
    addRow(data: any[]): any;
    getCell(address: string): {
      value: any;
      style: any;
    };
    eachRow(callback: (row: any, rowNumber: number) => void): void;
    getRow(rowNumber: number): any;
    getColumn(columnNumber: number | string): any;
  }
  
  export default {
    Workbook,
    Worksheet
  };
} 