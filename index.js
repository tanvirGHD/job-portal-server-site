const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config();
const port = process.env.PORT || 3000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.y15rh.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");



  // jobs related api
  const jobsCollection = client.db('JobPortal').collection('jobs');
  const jobApplicationCollection = client.db('JobPortal').collection('job_applications');

  // Jobs related apis
  // All job data load 
  app.get('/jobs', async(req, res)=>{
    const email = req.query.email;
    let query = {};
    if(email){
      query = {hrEmail: email}
    }

    const cursor = jobsCollection.find(query);
    const result = await cursor.toArray();
    res.send(result);
  });


  //details page er jonno data load korbo (ak ta kore job data load)
  app.get('/jobs/:id', async(req, res) =>{
    const id = req.params.id;
    const query = {_id: new ObjectId(id)}
    const result = await jobsCollection.findOne(query)
    res.send(result)
  })



  //create a job
  app.post('/jobs', async(req, res)=>{
    const newJob = req.body;
    const result = await jobsCollection.insertOne(newJob);
    res.send(result);
  })


  // app.get('/job-applications/:id') ==> get a specific job application by id

  app.get('/job-application/jobs/:job_id', async (req, res) =>{
    const jobId = req.params.job_id;
    const query = {job_id: jobId}
    const result  = await jobApplicationCollection.find(query).toArray();
    res.send(result)
  })



  //job application api
  //get all data get one data, get some data [0, 1, many]
app.get('/job-application', async(req, res)=>{
  const email = req.query.email;
  const query = {applicant_email: email};
  const result = await jobApplicationCollection.find(query).toArray();

  // fokira way to aggregate data
  for(const application of result){
    console.log(application.job_id);
    const query1 = {_id: new ObjectId(application.job_id)};
    const job = await jobsCollection.findOne(query1);
    if(job){
      application.title = job.title;
      application.company =  job.company;
      application.company_logo = job.company_logo;
    }
  }
  res.send(result);
})


  app.post('/job-applications', async(req, res)=>{
    const application = req.body;
    const result = await jobApplicationCollection.insertOne(application);

    // Not the best way ( best way ---> use aggregate ) 
    const id = application.job_id;
    const query = { _id: new ObjectId(id)}
    const job = await jobsCollection.findOne(query);
    let newCount = 0;
    if(job.applicationCount){
      newCount = job.applicationCount + 1;
    }
    else{
      newCount = 1;
    }

    // now update the job info
    const filter = { _id: new ObjectId(id)}
    const updatedDoc = {
      $set:{
        applicationCount: newCount
      }
    }

    const updateResult = await jobsCollection.updateOne(filter, updatedDoc)

    res.send(result)
  })

  //update 
  app.patch('/job-applications/:id', async(req, res) => {
    const id = req.params.id;
    const data = req.body;
    const filter = {_id: new ObjectId(id)};
    const updatedDoc= {
       $set:{
        status: data.status
       }
    }
    const result = await jobApplicationCollection.updateOne(filter, updatedDoc);
    res.send(result)
  })


  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);


app.get('/', (req, res) =>{
    res.send('Job is Falling from the sky');
})


app.listen(port, ()=>{
    console.log(`Job is waiting at: ${port}`)
})
