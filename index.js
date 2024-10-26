const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const Joi = require('joi'); // Import Joi for validation

const app = express();

// Middleware
app.use(express.json());
app.use(cors());


app.post("/generate", (req, res) => {
  const { modelName, modelSchema } = req.body;

  // Validate request
  if (!modelName || !modelSchema || typeof modelName !== 'string' || typeof modelSchema !== 'object') {
    return res.status(400).json({
      error: 'Invalid request. Please provide a valid modelName (string) and modelSchema (object).'
    });
  }

  console.log('Model Name:', modelName);
  console.log('Model Schema:', modelSchema);

  // Capitalize model name
  const capitalizedModelName = modelName.charAt(0).toUpperCase() + modelName.slice(1);
  const modelNameLower = modelName.toLowerCase();

  // Define file paths
  const modelPath = path.join(__dirname, "models", `${capitalizedModelName}.js`);
  const servicePath = path.join(__dirname, "services", `${capitalizedModelName}Service.js`);
  const controllerPath = path.join(__dirname, "controllers", `${capitalizedModelName}Controller.js`);
  const routePath = path.join(__dirname, "routes", `${capitalizedModelName}Routes.js`);
  const testDirPath = path.join(__dirname, "tests");
  const testPath = path.join(testDirPath, `${capitalizedModelName}.test.js`);
  const validatorPath = path.join(__dirname, "validators", `${capitalizedModelName}Validator.js`);

  // Create 'tests' and 'validators' directories if they do not exist
  if (!fs.existsSync(testDirPath)) {
    fs.mkdirSync(testDirPath);
  }
  if (!fs.existsSync(path.join(__dirname, "validators"))) {
    fs.mkdirSync(path.join(__dirname, "validators"));
  }

  // Generate Model File
  const modelFileContent = `
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ${capitalizedModelName}Schema = new Schema(${JSON.stringify(modelSchema, null, 4)});

module.exports = mongoose.model('${capitalizedModelName}', ${capitalizedModelName}Schema);
  `;
  fs.writeFileSync(modelPath, modelFileContent.trim());

  // Generate Service File
  const serviceFileContent = `
const ${capitalizedModelName} = require('../models/${capitalizedModelName}');

exports.create${capitalizedModelName} = async (data) => {
  return await ${capitalizedModelName}.create(data);
};

exports.get${capitalizedModelName}ById = async (id) => {
  return await ${capitalizedModelName}.findById(id);
};

exports.getAll${capitalizedModelName}s = async (query, options = {}) => {
  const { page = 1, limit = 10, sort = null, search = {} } = options;

  if (isNaN(page) || page <= 0 || isNaN(limit) || limit <= 0) {
    throw new Error('Invalid page or limit values');
  }

  let searchQuery = {};
  if (search && typeof search === 'object' && Object.keys(search).length > 0) {
    searchQuery = Object.keys(search).reduce((acc, key) => {
      const fieldType = ${capitalizedModelName}.schema.paths[key]?.instance;

      if (fieldType === 'String') {
        acc[key] = { $regex: search[key], $options: 'i' };
      } else {
        acc[key] = search[key];
      }

      return acc;
    }, {});
  }

  let sortQuery = {};
  if (sort) {
    const sortFields = sort.split(',').map(field => field.trim());
    sortQuery = sortFields.reduce((acc, field) => {
      const [key, order] = field.split(':');
      acc[key] = order === 'desc' ? -1 : 1;
      return acc;
    }, {});
  }

  const combinedQuery = { ...query, ...searchQuery };

  const results = await ${capitalizedModelName}
    .find(combinedQuery.search)
    .sort(sortQuery)
    .skip((page - 1) * limit)
    .limit(parseInt(limit));
  const count = await ${capitalizedModelName}.countDocuments();
  return {
    total: count,
    page,
    limit,
    results
  };
};

exports.update${capitalizedModelName} = async (id, data) => {
  return await ${capitalizedModelName}.findByIdAndUpdate(id, data, { new: true });
};

exports.delete${capitalizedModelName} = async (id) => {
  return await ${capitalizedModelName}.findByIdAndDelete(id);
};
  `;
  fs.writeFileSync(servicePath, serviceFileContent.trim());

  // Generate Controller File
  const controllerFileContent = `
const ${capitalizedModelName}Service = require('../services/${capitalizedModelName}Service');
const { validate${capitalizedModelName} } = require('../validators/${capitalizedModelName}Validator');

exports.create${capitalizedModelName} = async (req, res) => {
  try {
    // Validate request data
    const { error } = validate${capitalizedModelName}(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const ${modelNameLower} = await ${capitalizedModelName}Service.create${capitalizedModelName}(req.body);
    res.status(201).json(${modelNameLower});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.get${capitalizedModelName}ById = async (req, res) => {
  try {
    const ${modelNameLower} = await ${capitalizedModelName}Service.get${capitalizedModelName}ById(req.params.id);
    if (!${modelNameLower}) return res.status(404).json({ error: '${capitalizedModelName} not found' });
    res.status(200).json(${modelNameLower});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.getAll${capitalizedModelName}s = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sort: req.query.sort || null,
      search: req.query.search || null
    };

    const ${modelNameLower}s = await ${capitalizedModelName}Service.getAll${capitalizedModelName}s(req.query, options);
    res.status(200).json(${modelNameLower}s);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.update${capitalizedModelName} = async (req, res) => {
  try {
    // Validate request data
    const { error } = validate${capitalizedModelName}(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    const updated${capitalizedModelName} = await ${capitalizedModelName}Service.update${capitalizedModelName}(req.params.id, req.body);
    if (!updated${capitalizedModelName}) return res.status(404).json({ error: '${capitalizedModelName} not found' });
    res.status(200).json(updated${capitalizedModelName});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.delete${capitalizedModelName} = async (req, res) => {
  try {
    const result = await ${capitalizedModelName}Service.delete${capitalizedModelName}(req.params.id);
    if (!result) return res.status(404).json({ error: '${capitalizedModelName} not found' });
    res.status(204).send();
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
  `;
  fs.writeFileSync(controllerPath, controllerFileContent.trim());

  // Generate Routes File
  const routeFileContent = `
const express = require('express');
const ${capitalizedModelName}Controller = require('../controllers/${capitalizedModelName}Controller');

const router = express.Router();

router.post('/', ${capitalizedModelName}Controller.create${capitalizedModelName});
router.get('/:id', ${capitalizedModelName}Controller.get${capitalizedModelName}ById);
router.get('/', ${capitalizedModelName}Controller.getAll${capitalizedModelName}s);
router.put('/:id', ${capitalizedModelName}Controller.update${capitalizedModelName});
router.delete('/:id', ${capitalizedModelName}Controller.delete${capitalizedModelName});

module.exports = router;
  `;
  fs.writeFileSync(routePath, routeFileContent.trim());

  // Generate Test File
  const testFileContent = `
const request = require('supertest');
const app = require('../app');
const mongoose = require('mongoose');
const ${capitalizedModelName} = require('../models/${capitalizedModelName}');

describe('${capitalizedModelName} API', () => {
  beforeAll(async () => {
    await mongoose.connect('mongodb://localhost:27017/test', { useNewUrlParser: true, useUnifiedTopology: true });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  it('should create a new ${capitalizedModelName}', async () => {
    const response = await request(app)
      .post('/${modelNameLower}')
      .send({/* your test data here */});
    expect(response.statusCode).toBe(201);
    // Add more assertions here
  });

  it('should get a ${capitalizedModelName} by ID', async () => {
    const ${modelNameLower} = new ${capitalizedModelName}({/* your test data here */});
    await ${modelNameLower}.save();
    const response = await request(app)
      .get(\`/${modelNameLower._id}\`);
    expect(response.statusCode).toBe(200);
    // Add more assertions here
  });

  // Add more tests as needed
});
  `;
  fs.writeFileSync(testPath, testFileContent.trim());

  // Generate Validator File
  const validatorFileContent = `
const Joi = require('joi'); // Ensure Joi is imported

// Convert model schema to Joi schema
function convertModelSchemaToJoi(schema) {
  const joiSchema = {};



  for (const [key, value] of Object.entries(schema)) {
    if (value === 'String') {
      joiSchema[key] = Joi.string().required();
    } else if (value === 'Number') {
      joiSchema[key] = Joi.number().required();
    } else if (value === 'Boolean') {
      joiSchema[key] = Joi.boolean().required();
    } else if (value === 'Date') {
      joiSchema[key] = Joi.date().required();
    } else if (Array.isArray(value)) {
      // Handle arrays with a well-defined item schema
      if (value.length > 0 && typeof value[0] === 'object') {
        joiSchema[key] = Joi.array().items(convertModelSchemaToJoi(value[0])).required();
      } else {
        // Handle case where array schema is not well defined or contains primitive types
        joiSchema[key] = Joi.array().items(Joi.any()).required();
      }
    } else if (typeof value === 'object') {
      joiSchema[key] = Joi.object(convertModelSchemaToJoi(value)).required();
    } else {
      throw new Error('Unsupported schema type for key: ' + key);
    }
  }



  return joiSchema;
}

// Define schema based on your modelSchema
const modelSchema = ${JSON.stringify(modelSchema, null, 4)};
const ${capitalizedModelName}Schema = Joi.object(convertModelSchemaToJoi(modelSchema));

exports.validate${capitalizedModelName} = (data) => {
  return ${capitalizedModelName}Schema.validate(data);
};
`;




  fs.writeFileSync(validatorPath, validatorFileContent.trim());

  // Update app.js with new route
  const routeImport = `const ${modelNameLower}Routes = require('./routes/${capitalizedModelName}Routes');\n`;
  const routeUse = `app.use('/${modelNameLower}', ${modelNameLower}Routes);\n`;

  // Read the current content of app.js
  let appJsContent = fs.readFileSync(path.join(__dirname, "app.js"), "utf8");

  // Insert the new import and route setup before the "startServer" function
  const startServerPosition = appJsContent.lastIndexOf("app.listen");
  if (startServerPosition > -1) {
    appJsContent = appJsContent.slice(0, startServerPosition) +
      routeImport +
      routeUse +
      appJsContent.slice(startServerPosition);
    
    // Write the updated content back to app.js
    fs.writeFileSync(path.join(__dirname, "app.js"), appJsContent, "utf8");
  }

  res.json({
    message: `${capitalizedModelName} files generated, test file created, validator added, and route added to app.js successfully.`,
  });


  
});

// Port configuration
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
