require('dotenv').config({ path: '.env.local' });
const { CloudWatchLogsClient, FilterLogEventsCommand } = require('@aws-sdk/client-cloudwatch-logs');

// Environment variables
const awsRegion = process.env.AWS_REGION || 'us-east-1';
const lambdaFunctionName = process.env.AWS_LAMBDA_REMOTION_FUNCTION;

if (!lambdaFunctionName) {
  console.error('❌ Missing AWS_LAMBDA_REMOTION_FUNCTION environment variable');
  process.exit(1);
}

const cloudWatchClient = new CloudWatchLogsClient({ region: awsRegion });

async function checkLambdaLogs(renderId) {
  console.log(`🔍 Checking Lambda logs for render: ${renderId}\n`);

  try {
    // Get the log group name for the Lambda function
    const logGroupName = `/aws/lambda/${lambdaFunctionName}`;
    
    console.log(`📋 Log Group: ${logGroupName}`);
    console.log(`🔍 Searching for logs containing render ID: ${renderId}\n`);

    // Filter logs for this specific render
    const filterCommand = new FilterLogEventsCommand({
      logGroupName: logGroupName,
      filterPattern: renderId,
      startTime: Date.now() - (24 * 60 * 60 * 1000), // Last 24 hours
      limit: 100
    });

    const response = await cloudWatchClient.send(filterCommand);
    
    if (!response.events || response.events.length === 0) {
      console.log('❌ No logs found for this render ID');
      console.log('💡 This could mean:');
      console.log('   - The render failed before Lambda was invoked');
      console.log('   - The logs have been rotated');
      console.log('   - There was an issue with the Lambda function name');
      return;
    }

    console.log(`✅ Found ${response.events.length} log events:\n`);
    
    // Sort events by timestamp
    const sortedEvents = response.events.sort((a, b) => a.timestamp - b.timestamp);
    
    sortedEvents.forEach((event, index) => {
      const timestamp = new Date(event.timestamp).toISOString();
      console.log(`[${index + 1}] ${timestamp}`);
      console.log(`    ${event.message}`);
      console.log('');
    });

    // Also check for any ERROR level logs
    console.log('🔍 Checking for ERROR level logs...\n');
    const errorFilterCommand = new FilterLogEventsCommand({
      logGroupName: logGroupName,
      filterPattern: `{($.level = "ERROR") || ($.level = "error") || ($.level = "FATAL") || ($.level = "fatal")} ${renderId}`,
      startTime: Date.now() - (24 * 60 * 60 * 1000),
      limit: 50
    });

    const errorResponse = await cloudWatchClient.send(errorFilterCommand);
    
    if (errorResponse.events && errorResponse.events.length > 0) {
      console.log(`❌ Found ${errorResponse.events.length} error logs:\n`);
      
      errorResponse.events.forEach((event, index) => {
        const timestamp = new Date(event.timestamp).toISOString();
        console.log(`[ERROR ${index + 1}] ${timestamp}`);
        console.log(`    ${event.message}`);
        console.log('');
      });
    } else {
      console.log('✅ No specific error logs found for this render');
    }

  } catch (error) {
    console.error('❌ Error checking Lambda logs:', error.message);
    
    if (error.name === 'ResourceNotFoundException') {
      console.log('\n💡 The log group might not exist yet, or the Lambda function name might be incorrect.');
      console.log(`   Expected log group: /aws/lambda/${lambdaFunctionName}`);
    }
  }
}

// Get render ID from command line argument
const renderId = process.argv[2];
if (!renderId) {
  console.error('❌ Please provide a render ID as an argument');
  console.log('Usage: node scripts/check-lambda-logs.js <renderId>');
  process.exit(1);
}

checkLambdaLogs(renderId); 