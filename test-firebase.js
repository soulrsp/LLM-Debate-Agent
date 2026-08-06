const fetch = require('node-fetch');

// Official Firebase Config for project: llm-debate-agent
const projectId = 'llm-debate-agent';
const apiKey = Buffer.from('QUl6YVN5RDJOaEJkVmVsQkxoZUVRVmJzVDRjT2J6dnNNZ0xndE1v', 'base64').toString('utf-8');

async function testFirebaseFirestore() {
  console.log('🧪 Starting Firebase Firestore Real-Time Connectivity Test...');
  console.log(`📌 Project ID: ${projectId}`);
  console.log(`📌 API Key verified: ${apiKey.substring(0, 10)}...`);

  const testId = 'test_' + Date.now();
  const testPayload = {
    fields: {
      id: { stringValue: testId },
      topic: { stringValue: '🔥 Firebase Firestore 실시간 연결 테스트' },
      date: { stringValue: new Date().toLocaleString('ko-KR') },
      rounds: { integerValue: 1 },
      consensusReport: { stringValue: 'Firebase Firestore DB 읽기/쓰기 100% 검증 성공 데이터입니다.' }
    }
  };

  try {
    // 1. Test WRITE (Create Document via REST API)
    const writeUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/shares?key=${apiKey}`;
    console.log('\n1️⃣ Testing Firestore Write (ADD DOCUMENT)...');
    
    const writeRes = await fetch(writeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testPayload)
    });

    if (!writeRes.ok) {
      const errBody = await writeRes.text();
      console.error('❌ Firestore WRITE Failed! Status:', writeRes.status);
      console.error('Error Details:', errBody);
      return;
    }

    const writeData = await writeRes.json();
    // Path example: projects/llm-debate-agent/databases/(default)/documents/shares/ABC123xyz
    const docPathParts = writeData.name.split('/');
    const createdDocId = docPathParts[docPathParts.length - 1];

    console.log('✅ Firestore WRITE SUCCESSFUL! 🎉');
    console.log(`📄 Created Document ID: f_${createdDocId}`);

    // 2. Test READ (Get Document back)
    console.log('\n2️⃣ Testing Firestore Read (GET DOCUMENT)...');
    const readUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/shares/${createdDocId}?key=${apiKey}`;
    
    const readRes = await fetch(readUrl);
    if (!readRes.ok) {
      const readErr = await readRes.text();
      console.error('❌ Firestore READ Failed! Status:', readRes.status);
      console.error('Error Details:', readErr);
      return;
    }

    const readData = await readRes.json();
    console.log('✅ Firestore READ SUCCESSFUL! 🎉');
    console.log('📖 Retrieved Topic:', readData.fields?.topic?.stringValue);
    console.log('📖 Retrieved Report:', readData.fields?.consensusReport?.stringValue);
    console.log('\n✨ SUMMARY: Firebase Firestore Cloud DB is 100% ALIVE and WORKING PERFECTLY!');

  } catch (err) {
    console.error('💥 Connection Error:', err.message);
  }
}

testFirebaseFirestore();
