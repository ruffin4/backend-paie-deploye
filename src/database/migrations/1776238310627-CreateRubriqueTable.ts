import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRubriqueTable1776238310627 implements MigrationInterface {
  name = 'CreateRubriqueTable1776238310627';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."rubriques_type_enum" AS ENUM('GAIN', 'RETENUE', 'INDEMNITE', 'PRIME', 'AVANTAGE_NATURE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."rubriques_modecalcul_enum" AS ENUM('FIXE', 'POURCENTAGE_SALAIRE', 'TAUX_HORAIRE')`,
    );
    await queryRunner.query(
      `CREATE TYPE "public"."rubriques_sens_enum" AS ENUM('POSITIF', 'NEGATIF')`,
    );
    await queryRunner.query(
      `CREATE TABLE "rubriques" ("uuid" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying(50) NOT NULL, "libelle" character varying(200) NOT NULL, "description" text, "type" "public"."rubriques_type_enum" NOT NULL, "categorie" character varying(50), "modeCalcul" "public"."rubriques_modecalcul_enum" NOT NULL, "valeurFixe" numeric(15,2), "pourcentageBase" numeric(5,2), "estImposableIRSA" boolean NOT NULL DEFAULT true, "estCotisableCNaPS" boolean NOT NULL DEFAULT true, "estCotisableOSTIE" boolean NOT NULL DEFAULT true, "estCotisableFMFPR" boolean NOT NULL DEFAULT true, "sens" "public"."rubriques_sens_enum" NOT NULL DEFAULT 'POSITIF', "ordreAffichage" integer NOT NULL DEFAULT '0', "actif" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_e81c2d4ffb70e605a2e2c47c2c7" UNIQUE ("code"), CONSTRAINT "PK_5661425e66b648cda659a0211ea" PRIMARY KEY ("uuid"))`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "rubriques"`);
    await queryRunner.query(`DROP TYPE "public"."rubriques_sens_enum"`);
    await queryRunner.query(`DROP TYPE "public"."rubriques_modecalcul_enum"`);
    await queryRunner.query(`DROP TYPE "public"."rubriques_type_enum"`);
  }
}
