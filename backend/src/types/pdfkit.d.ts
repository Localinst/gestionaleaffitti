declare module 'pdfkit' {
  interface PDFDocumentOptions {
    margin?: number;
    size?: string;
    bufferPages?: boolean;
    autoFirstPage?: boolean;
    [key: string]: any;
  }

  interface TextOptions {
    align?: 'left' | 'center' | 'right' | 'justify';
    width?: number;
    height?: number;
    [key: string]: any;
  }

  class PDFDocument {
    constructor(options?: PDFDocumentOptions);
    
    font(font: string): this;
    fontSize(size: number): this;
    text(text: string, options?: TextOptions): this;
    text(text: string, x?: number, y?: number, options?: TextOptions): this;
    moveDown(lines?: number): this;
    
    on(event: string, callback: Function): this;
    
    page: {
      width: number;
      height: number;
    };
    
    strokeColor(color: string): this;
    fillColor(color: string): this;
    lineWidth(width: number): this;
    rect(x: number, y: number, w: number, h: number): this;
    stroke(): this;
    fill(): this;
    
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    
    addPage(options?: PDFDocumentOptions): this;
    
    currentLineHeight(): number;
    
    end(): void;
    
    bufferedPageRange(): { start: number; count: number };
    switchToPage(pageNumber: number): this;
  }
  
  export = PDFDocument;
} 