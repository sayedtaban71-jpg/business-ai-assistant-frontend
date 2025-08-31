'use server';
import { neon } from "@neondatabase/serverless";
import {Pool} from "pg";
import { Company, Board, Tile, TileMessage } from '@/types';

// Get the database connection
const sql = neon(process.env.DATABASE_URL!);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // or specify host, user, password, etc.
});

// Database functions using Neon
export async function getCompanies(userId: string): Promise<Company[]> {
  try {
    // const companies = await sql`
    //   SELECT * FROM companies
    // `;
    const companies = await pool.query(`
      SELECT * FROM companies
    `);
    return companies.rows as Company[];
  } catch (error) {
    console.error('Error fetching companies:', error);
    return [];
  }
}

export async function getBoards(userId: string): Promise<Board[]> {
  try {
    // const boards = await sql`
    //   SELECT * FROM boards
    // `;
    const boards = await pool.query(`
      SELECT * FROM boards
    `);
    return boards.rows as Board[];
  } catch (error) {
    console.error('Error fetching boards:', error);
    return [];
  }
}

export async function getTiles(boardId: string): Promise<Tile[]> {
  try {
    // const tiles = await sql`
    //   SELECT * FROM tiles
    // `;
    const tiles = await pool.query(`SELECT * FROM tiles`)
    return tiles.rows as Tile[];
  } catch (error) {
    console.error('Error fetching tiles:', error);
    return [];
  }
}

export async function getTileMessages(tileId: string): Promise<TileMessage[]> {
  try {
    // const messages = await sql`
    //   SELECT * FROM tile_messages
    //   WHERE tile_id = ${tileId}
    // `;
    const messages = await pool.query(`SELECT * FROM tile_messages WHERE tile_id = ${tileId}`)
    return messages.rows as TileMessage[];
  } catch (error) {
    console.error('Error fetching tile messages:', error);
    return [];
  }
}

export async function createTile(data: Partial<Tile>): Promise<Tile | null> {
  try {
    const [tile] = await sql`
      INSERT INTO tiles (board_id, title, base_prompt, "order", status, last_answer, last_run_context_version)
      VALUES (${data.board_id}, ${data.title}, ${data.base_prompt}, ${data.order}, 'idle', '', 0)
      RETURNING *
    `;
    return tile as Tile;
  } catch (error) {
    console.error('Error creating tile:', error);
    throw new Error('Failed to create tile');
  }
}

export async function updateTile(id: string, data: Partial<Tile>): Promise<Tile | null> {
  try {
    // Check if we have fields to update
    if (Object.keys(data).length === 0) {
      return null;
    }

    // Handle status updates
    if (data.status !== undefined) {
      const [tile] = await sql`
        UPDATE tiles 
        SET status = ${data.status}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return tile as Tile;
    }
    
    // Handle last_answer updates
    if (data.last_answer !== undefined) {
      const [tile] = await sql`
        UPDATE tiles 
        SET last_answer = ${data.last_answer}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return tile as Tile;
    }
    
    // Handle last_run_context_version updates
    if (data.last_run_context_version !== undefined) {
      const [tile] = await sql`
        UPDATE tiles 
        SET last_run_context_version = ${data.last_run_context_version}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return tile as Tile;
    }
    
    // Handle title and base_prompt updates (can be updated together)
    if (data.title !== undefined || data.base_prompt !== undefined) {
      const [tile] = await sql`
        UPDATE tiles 
        SET 
          title = COALESCE(${data.title}, title),
          base_prompt = COALESCE(${data.base_prompt}, base_prompt),
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
      return tile as Tile;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating tile:', error);
    throw new Error('Failed to update tile');
  }
}

export async function deleteTile(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM tiles 
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error('Error deleting tile:', error);
    throw new Error('Failed to delete tile');
  }
}

export async function deleteCompany(id: string): Promise<boolean> {
  try {
    const result = await sql`
      DELETE FROM companies 
      WHERE id = ${id}
    `;
    return true;
  } catch (error) {
    console.error('Error deleting company:', error);
    throw new Error('Failed to delete company');
  }
}

export async function createTileMessage(data: Partial<TileMessage>): Promise<TileMessage | null> {
  try {
    const [message] = await sql`
      INSERT INTO tile_messages (tile_id, role, content)
      VALUES (${data.tile_id}, ${data.role}, ${data.content})
      RETURNING *
    `;
    return message as TileMessage;
  } catch (error) {
    console.error('Error creating tile message:', error);
    throw new Error('Failed to create tile message');
  }
}

export async function getCompany(id: string): Promise<Company | null> {
  try {
    const [company] = await sql`
      SELECT * FROM companies 
      WHERE id = ${id}
    `;
    return company as Company;
  } catch (error) {
    console.error('Error fetching company:', error);
    return null;
  }
}

export async function createCompany(data: Partial<Company>): Promise<Company | null> {
  try {
    const [company] = await sql`
      INSERT INTO companies (user_id, name, industry, product, icp, notes)
      VALUES (${data.user_id}, ${data.name}, ${data.industry}, ${data.product}, ${data.icp}, ${data.notes || ''})
      RETURNING *
    `;
    return company as Company;
  } catch (error) {
    console.error('Error creating company:', error);
    throw new Error('Failed to create company');
  }
}

// Initialize database tables if they don't exist
export async function initializeDatabase() {
  try {
    // Create companies table
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id   PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        industry TEXT NOT NULL,
        product TEXT NOT NULL,
        icp TEXT NOT NULL,
        notes TEXT,
        uploaded_data_json JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create boards table
    await sql`
      CREATE TABLE IF NOT EXISTS boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create tiles table
    await sql`
      CREATE TABLE IF NOT EXISTS tiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        base_prompt TEXT NOT NULL,
        "order" INTEGER NOT NULL DEFAULT 0,
        last_answer TEXT DEFAULT '',
        last_run_context_version INTEGER DEFAULT 0,
        status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'loading', 'error', 'completed')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Create tile_messages table
    await sql`
      CREATE TABLE IF NOT EXISTS tile_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        tile_id UUID NOT NULL REFERENCES tiles(id) ON DELETE CASCADE,
        role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Insert sample data if tables are empty
    const companiesCount = await sql`SELECT COUNT(*) FROM companies`;
    if (companiesCount[0].count === '0') {
      await sql`
        INSERT INTO companies (user_id, name, industry, product, icp, notes) VALUES
        ('user-1', 'InnovateTech Solutions', 'Technology Consulting', 'Digital Transformation Services', 'Enterprise companies seeking digital innovation', 'Focus on AI-driven solutions and cloud migration'),
        ('user-1', 'GreenEnergy Corp', 'Renewable Energy', 'Solar Panel Systems', 'Commercial and residential property owners', 'Expanding into smart grid technology'),
        ('user-1', 'HealthTech Innovations', 'Healthcare Technology', 'Patient Management Platform', 'Hospitals and healthcare providers', 'AI-powered diagnostics and patient care')
      `;
    }

    const boardsCount = await sql`SELECT COUNT(*) FROM boards`;
    if (boardsCount[0].count === '0') {
      await sql`
        INSERT INTO boards (user_id, name) VALUES
        ('user-1', 'Strategic Sales Board'),
        ('user-1', 'Market Analysis Board'),
        ('user-1', 'Customer Success Board')
      `;
    }

    const tilesCount = await sql`SELECT COUNT(*) FROM tiles`;
    if (tilesCount[0].count === '0') {
      const boards = await sql`SELECT id FROM boards WHERE user_id = 'user-1'`;
      if (boards.length >= 3) {
        await sql`
          INSERT INTO tiles (board_id, title, base_prompt, "order") VALUES
          (${boards[0].id}, 'Market Opportunity Analysis', 'Analyze the market opportunity for this company and identify key growth areas.', 0),
          (${boards[0].id}, 'Competitive Positioning', 'Create a competitive analysis and positioning strategy for this company.', 1),
          (${boards[1].id}, 'Industry Trends', 'Identify current industry trends and how they impact this company.', 0),
          (${boards[2].id}, 'Customer Journey Mapping', 'Map out the customer journey and identify touchpoints for improvement.', 0)
        `;
      }
    }

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}
