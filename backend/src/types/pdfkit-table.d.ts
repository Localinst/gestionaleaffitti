declare module 'pdfkit-table' {
  import PDFDocument from 'pdfkit';
  
  interface TableOptions {
    title?: string;
    subtitle?: string;
    headers?: any[];
    rows?: any[][];
    [key: string]: any;
  }
  
  class PDFDocumentWithTable extends PDFDocument {
    table(table: TableOptions, options?: any): Promise<this>;
  }
  
  export default PDFDocumentWithTable;
} 