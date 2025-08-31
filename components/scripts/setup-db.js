#!/usr/bin/env node

/**
 * Database Setup Script
 * 
 * This script initializes the database tables and inserts sample data.
 * Run this after setting up your Neon database connection.
 */

require('dotenv').config({ path: '.env.local' });

const { neon } = require('@neondatabase/serverless');

async function setupDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    console.log('Please create a .env.local file with your Neon database URL');
    process.exit(1);
  }

  console.log('🚀 Connecting to Neon database...');
  
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    // Test connection
    await sql`SELECT 1`;
    console.log('✅ Database connection successful');
    
    console.log('📋 Creating tables...');
    
    // Create companies table
    await sql`
      CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    console.log('✅ Companies table created');

    // Create boards table
    await sql`
      CREATE TABLE IF NOT EXISTS boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id TEXT NOT NULL,
        name TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;
    console.log('✅ Boards table created');

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
    console.log('✅ Tiles table created');

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
    console.log('✅ Tile messages table created');

    console.log('📊 Inserting sample data...');
    
    // Insert sample companies
    const companiesCount = await sql`SELECT COUNT(*) FROM companies`;
    if (companiesCount[0].count === '0') {
      await sql`
        INSERT INTO companies (user_id, name, industry, product, icp, notes) VALUES
        ('user-1', 'InnovateTech Solutions', 'Technology Consulting', 'Digital Transformation Services', 'Enterprise companies seeking digital innovation', 'Focus on AI-driven solutions and cloud migration'),
        ('user-1', 'GreenEnergy Corp', 'Renewable Energy', 'Solar Panel Systems', 'Commercial and residential property owners', 'Expanding into smart grid technology'),
        ('user-1', 'HealthTech Innovations', 'Healthcare Technology', 'Patient Management Platform', 'Hospitals and healthcare providers', 'AI-powered diagnostics and patient care')
      `;
      console.log('✅ Sample companies inserted');
    } else {
      console.log('ℹ️  Companies already exist, skipping...');
    }

    // Insert sample boards
    const boardsCount = await sql`SELECT COUNT(*) FROM boards`;
    if (boardsCount[0].count === '0') {
      await sql`
        INSERT INTO boards (user_id, name) VALUES
        ('user-1', 'Strategic Sales Board'),
        ('user-1', 'Market Analysis Board'),
        ('user-1', 'Customer Success Board')
      `;
      console.log('✅ Sample boards inserted');
    } else {
      console.log('ℹ️  Boards already exist, skipping...');
    }

    // Insert sample tiles
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
        console.log('✅ Sample tiles inserted');
      }
    } else {
      console.log('ℹ️  Tiles already exist, skipping...');
    }

    console.log('\n🎉 Database setup completed successfully!');
    console.log('You can now run "npm run dev" to start the application.');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
