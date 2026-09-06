declare module 'nodemailer' {
  type TransportOptions = Record<string, unknown>;
  type SendMailOptions = Record<string, unknown>;
  type Transporter = { sendMail(options:SendMailOptions):Promise<unknown> };
  export function createTransport(options:TransportOptions):Transporter;
  const nodemailer:{createTransport:typeof createTransport};
  export default nodemailer;
}
