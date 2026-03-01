import { NestFactory } from "@nestjs/core";
import {
  FastifyAdapter,
  NestFastifyApplication,
} from "@nestjs/platform-fastify";
import { ValidationPipe, Logger } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const logger = new Logger("Bootstrap");

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({ logger: process.env.NODE_ENV === "development" })
  );

  // Global prefix
  app.setGlobalPrefix("api/v1");

  // CORS
  app.enableCors({
    origin: [
      process.env.WEB_URL ?? "http://localhost:3000",
      "app://." // Electron
    ],
    credentials: true,
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    })
  );

  // Swagger (OpenAPI) — available for AI module dev too
  if (process.env.NODE_ENV !== "production") {
    const config = new DocumentBuilder()
      .setTitle("COAP API")
      .setDescription("Construction Operations & Accounting Platform")
      .setVersion("1.0")
      .addBearerAuth()
      .addTag("accounting", "Core accounting modules")
      .addTag("ar", "Accounts Receivable")
      .addTag("ap", "Accounts Payable")
      .addTag("banking", "Banking & Reconciliation")
      .addTag("jobs", "Job Costing & Projects")
      .addTag("payroll", "Payroll & Time Tracking")
      .addTag("kanban", "Project Management")
      .addTag("vendor-portal", "Subcontractor Portal")
      .addTag("ai", "AI Analysis Module")
      .addTag("reports", "Reporting")
      .addTag("migration", "QB Data Migration")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup("api/docs", app, document);
    logger.log("Swagger docs: http://localhost:3001/api/docs");
  }

  const port = process.env.PORT ?? 3001;
  await app.listen(port, "0.0.0.0");
  logger.log(`COAP API running on port ${port}`);
}

bootstrap();
