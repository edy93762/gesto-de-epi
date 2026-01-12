
import { neon } from '@neondatabase/serverless';
import { Collaborator, Delivery, EPI } from '../types';

const CONNECTION_STRING = 'postgresql://neondb_owner:npg_Lf4svrNIzdG1@ep-broad-cell-ah6d0uem-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require';

// O driver 'neon' usa HTTP (fetch), ideal para serverless/navegador pois não mantém conexão aberta
const sql = neon(CONNECTION_STRING);

export const DatabaseService = {
  // Inicializa tabelas se não existirem
  async init() {
    console.log("Inicializando banco de dados via HTTP...");
    
    try {
      // Tabela Colaboradores
      await sql(`
        CREATE TABLE IF NOT EXISTS collaborators (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          cpf TEXT NOT NULL,
          sector TEXT,
          role TEXT,
          branch TEXT,
          shift TEXT,
          manager_name TEXT,
          manager_email TEXT,
          active BOOLEAN DEFAULT TRUE
        );
      `);

      // Tabela EPIs
      await sql(`
        CREATE TABLE IF NOT EXISTS epis (
          id TEXT PRIMARY KEY,
          description TEXT NOT NULL,
          active BOOLEAN DEFAULT TRUE,
          created_at TEXT
        );
      `);

      // Tabela Entregas
      await sql(`
        CREATE TABLE IF NOT EXISTS deliveries (
          id TEXT PRIMARY KEY,
          date TEXT NOT NULL,
          collaborator_id TEXT NOT NULL,
          epi_id TEXT NOT NULL,
          reason TEXT,
          notes TEXT,
          responsible_email TEXT,
          photo TEXT
        );
      `);
      
      console.log("Tabelas verificadas/criadas com sucesso.");
    } catch (error) {
      console.error("Erro Fatal ao iniciar DB:", error);
      throw error;
    }
  },

  // --- COLABORADORES ---
  async getCollaborators(): Promise<Collaborator[]> {
    try {
      const rows = await sql('SELECT * FROM collaborators');
      // O driver neon retorna as linhas diretamente (array), não um objeto com .rows
      return rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        cpf: row.cpf,
        sector: row.sector,
        role: row.role,
        branch: row.branch,
        shift: row.shift as any,
        managerName: row.manager_name,
        managerEmail: row.manager_email,
        active: row.active
      }));
    } catch (error) {
      console.error("Erro ao buscar colaboradores:", error);
      return [];
    }
  },

  async addCollaborator(c: Collaborator) {
    await sql(
      `INSERT INTO collaborators (id, name, cpf, sector, role, branch, shift, manager_name, manager_email, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [c.id, c.name, c.cpf, c.sector, c.role, c.branch, c.shift, c.managerName, c.managerEmail, c.active]
    );
  },

  async deleteCollaborator(id: string) {
      await sql('DELETE FROM collaborators WHERE id = $1', [id]);
  },

  // --- EPIS ---
  async getEpis(): Promise<EPI[]> {
    try {
      const rows = await sql('SELECT * FROM epis');
      return rows.map((row: any) => ({
        id: row.id,
        description: row.description,
        active: row.active,
        createdAt: row.created_at
      }));
    } catch (error) {
      console.error("Erro ao buscar EPIs:", error);
      return [];
    }
  },

  async addEpi(e: EPI) {
    await sql(
      `INSERT INTO epis (id, description, active, created_at)
       VALUES ($1, $2, $3, $4)`,
      [e.id, e.description, e.active, e.createdAt]
    );
  },
  
  async deleteEpi(id: string) {
      await sql('DELETE FROM epis WHERE id = $1', [id]);
  },

  // --- ENTREGAS ---
  async getDeliveries(): Promise<Delivery[]> {
    try {
      const rows = await sql('SELECT * FROM deliveries ORDER BY date DESC');
      return rows.map((row: any) => ({
        id: row.id,
        date: row.date,
        collaboratorId: row.collaborator_id,
        epiId: row.epi_id,
        reason: row.reason as any,
        notes: row.notes,
        responsibleEmail: row.responsible_email,
        photo: row.photo
      }));
    } catch (error) {
      console.error("Erro ao buscar entregas:", error);
      return [];
    }
  },

  async addDelivery(d: Delivery) {
    await sql(
      `INSERT INTO deliveries (id, date, collaborator_id, epi_id, reason, notes, responsible_email, photo)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [d.id, d.date, d.collaboratorId, d.epiId, d.reason, d.notes, d.responsibleEmail, d.photo]
    );
  },

  async deleteAllDeliveries() {
    await sql('DELETE FROM deliveries');
    console.log("Todas as entregas foram apagadas.");
  }
};
