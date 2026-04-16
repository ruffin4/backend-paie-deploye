import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateEmployeTable1776236903518 implements MigrationInterface {
  name = 'CreateEmployeTable1776236903518';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "employes" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "matriculeInterne" character varying(50) NOT NULL, "matriculeCnaps" character varying(50), "nom" character varying(100) NOT NULL, "prenom" character varying(100), "dateEmbauche" date NOT NULL, "typeContrat" "public"."employes_typecontrat_enum" NOT NULL DEFAULT 'CDI', "dateSortie" date, "fonction" character varying(100), "categorie" character varying(20), "salaireBaseMensuel" numeric(15,2) NOT NULL, "nbEnfants" integer NOT NULL DEFAULT '0', "actif" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_56bb1d58f6bb407c5b2aa587ee9" UNIQUE ("matriculeInterne"), CONSTRAINT "PK_93584594247f3472dc686170e91" PRIMARY KEY ("uuid"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "employes"`);
  }
}
