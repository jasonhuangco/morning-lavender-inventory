import emailjs from '@emailjs/browser';
import { OrderSummary } from '../types';

export class EmailService {
  private serviceId: string;
  private templateId: string;
  private publicKey: string;

  constructor(serviceId: string, templateId: string, publicKey: string) {
    this.serviceId = serviceId;
    this.templateId = templateId;
    this.publicKey = publicKey;
    
    emailjs.init(this.publicKey);
  }

  async sendOrderEmail(orderSummary: OrderSummary): Promise<boolean> {
    try {
      const itemsList = orderSummary.items
        .map((item) => {
          const suppliersText = item.suppliers.length > 1 
            ? `Available from: ${item.suppliers.join(', ')}`
            : `Supplier: ${item.suppliers[0]}`;
            
          if (item.quantity !== undefined) {
            return `• ${item.productName} (Qty: ${item.quantity})\n  ${suppliersText}`;
          }
          return `• ${item.productName}\n  ${suppliersText}`;
        })
        .join('\n\n');

      const templateParams = {
        to_email: 'jason@morninglavender.com',
        location_name: orderSummary.locationName,
        user_name: orderSummary.userName,
        order_date: orderSummary.orderDate,
        items_list: itemsList,
        total_items: orderSummary.items.length,
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        templateParams
      );

      console.log('Email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }

  async sendTestEmail(): Promise<boolean> {
    try {
      const testParams = {
        to_email: 'jason@morninglavender.com',
        location_name: 'Test Location',
        user_name: 'Test User',
        order_date: new Date().toLocaleDateString(),
        items_list: 'Test Product 1 (Qty: 5) - Test Supplier\nTest Product 2 - Test Supplier',
        total_items: 2,
      };

      const response = await emailjs.send(
        this.serviceId,
        this.templateId,
        testParams
      );

      console.log('Test email sent successfully:', response);
      return true;
    } catch (error) {
      console.error('Failed to send test email:', error);
      return false;
    }
  }
}
