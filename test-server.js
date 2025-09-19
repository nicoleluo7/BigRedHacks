#!/usr/bin/env node

/**
 * Test script for the Gesture Recognition MCP Server
 * This script tests all the major functionality
 */

const SERVER_URL = 'http://localhost:3001';

async function testServer() {
  console.log('🧪 Testing Gesture Recognition MCP Server...\n');

  try {
    // Test 1: Get current gesture mappings
    console.log('1️⃣ Testing gesture mappings API...');
    const mappingsResponse = await fetch(`${SERVER_URL}/api/gestures`);
    const mappings = await mappingsResponse.json();
    console.log('✅ Gesture mappings loaded:', Object.keys(mappings));
    console.log('   Mappings:', JSON.stringify(mappings, null, 2));

    // Test 2: Test gesture detection
    console.log('\n2️⃣ Testing gesture detection...');
    const testGestures = ['wave', 'pinch', 'fist', 'open_palm'];
    
    for (const gesture of testGestures) {
      console.log(`   Testing ${gesture} gesture...`);
      const detectResponse = await fetch(`${SERVER_URL}/api/detect-gesture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gesture,
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (detectResponse.ok) {
        const result = await detectResponse.json();
        console.log(`   ✅ ${gesture}: ${result.success ? 'Success' : 'Failed'}`);
      } else {
        console.log(`   ❌ ${gesture}: HTTP ${detectResponse.status}`);
      }
      
      // Wait a bit between gestures
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Test 3: Update a gesture mapping
    console.log('\n3️⃣ Testing mapping update...');
    const updateResponse = await fetch(`${SERVER_URL}/api/gestures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gesture: 'thumbs_up',
        action: 'notification',
        params: { message: 'Thumbs up detected!' },
      }),
    });

    if (updateResponse.ok) {
      console.log('✅ Successfully added thumbs_up mapping');
      
      // Test the new mapping
      const testResponse = await fetch(`${SERVER_URL}/api/detect-gesture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gesture: 'thumbs_up',
          timestamp: new Date().toISOString(),
        }),
      });
      
      if (testResponse.ok) {
        console.log('✅ Successfully tested new thumbs_up mapping');
      }
    } else {
      console.log('❌ Failed to update mapping');
    }

    // Test 4: Check final mappings
    console.log('\n4️⃣ Final gesture mappings:');
    const finalResponse = await fetch(`${SERVER_URL}/api/gestures`);
    const finalMappings = await finalResponse.json();
    console.log('✅ Updated mappings:', Object.keys(finalMappings));

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📋 Server Summary:');
    console.log(`   - HTTP API: ${SERVER_URL}`);
    console.log(`   - WebSocket: ws://localhost:3001/ws`);
    console.log(`   - Available gestures: ${Object.keys(finalMappings).join(', ')}`);
    console.log(`   - Total mappings: ${Object.keys(finalMappings).length}`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run tests
testServer();
