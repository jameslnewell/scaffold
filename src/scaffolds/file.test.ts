import { createTasks } from '../createTasks.js'
import { createInMemoryFiles } from '../createInMemoryFiles.js'
import { copy, move, rm, template } from './file.js'

const tasks = createTasks()

describe(copy, () => {
  test('specific file is copied to destination file', async () => {
    const sourceFile = 'src/source.txt'
    const destinationFile = 'dest/copied.txt'
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      [sourceFile]: content
    }})

    await copy(sourceFile, destinationFile)({files, tasks})

    // assert the source file still exists with the original content
    expect(files.read(sourceFile)).toEqual(content)
    
    // assert the destination file now exists with the original content
    expect(files.read(destinationFile)).toEqual(content)
  })

  test('all files in directory are copied to destination directory', async () => {
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      ['src/cats.txt']: content,
      ['src/dogs.txt']: content,
      ['src/hamsters.txt']: content
    }})
    
    await copy('src', 'dest')({files, tasks})

    // assert the source file still exists with the original content
    expect(files.read('src/cats.txt')).toEqual(content)
    expect(files.read('src/dogs.txt')).toEqual(content)
    expect(files.read('src/hamsters.txt')).toEqual(content)
    
    // assert the destination file now exists with the original content
    expect(files.read('dest/cats.txt')).toEqual(content)
    expect(files.read('dest/dogs.txt')).toEqual(content)
    expect(files.read('dest/hamsters.txt')).toEqual(content)
  })

  test('all files matching to glob are copied to destination directory', async () => {
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      ['src/foo.bar']: content,
      ['src/cats.txt']: content,
      ['src/dogs.txt']: content,
      ['src/hamsters.txt']: content,
    }})
    
    await copy('src/*.txt', 'dest')({files, tasks})

    // assert the source files still exist with the original content
    expect(files.read('src/cats.txt')).toEqual(content)
    expect(files.read('src/dogs.txt')).toEqual(content)
    expect(files.read('src/hamsters.txt')).toEqual(content)
    
    // assert the destination files now exist with the original content
    expect(files.read('dest/foo.bar')).toBeUndefined()
    expect(files.read('dest/cats.txt')).toEqual(content)
    expect(files.read('dest/dogs.txt')).toEqual(content)
    expect(files.read('dest/hamsters.txt')).toEqual(content)
  })
  
})
describe(move, () => {
  test('specific file is moved to destination file', async () => {
    const source = 'src/source.txt'
    const destination = 'dest/copied.txt'
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      [source]: content
    }})

    await move(source, destination)({files, tasks})

    // assert the source file no longer exists
    expect(files.read(source)).toBeUndefined()
    
    // assert the destination file now exists with the original content
    expect(files.read(destination)).toEqual(content)
  })

  test('all files in directory are moved to destination directory', async () => {
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      ['src/cats.txt']: content,
      ['src/dogs.txt']: content,
      ['src/hamsters.txt']: content
    }})
    
    await move('src', 'dest')({files, tasks})

    // assert the source file no longer exists
    expect(files.read('src/cats.txt')).toBeUndefined()
    expect(files.read('src/dogs.txt')).toBeUndefined()
    expect(files.read('src/hamsters.txt')).toBeUndefined()
    
    // assert the destination file now exists with the original content
    expect(files.read('dest/cats.txt')).toEqual(content)
    expect(files.read('dest/dogs.txt')).toEqual(content)
    expect(files.read('dest/hamsters.txt')).toEqual(content)
  })

  test('all files matching to glob are moved to destination directory', async () => {
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      ['src/foo.bar']: content,
      ['src/cats.txt']: content,
      ['src/dogs.txt']: content,
      ['src/hamsters.txt']: content,
    }})
    
    await move('src/*.txt', 'dest')({files, tasks})

    // assert the source files still exist with the original content
    expect(files.read('src/cats.txt')).toBeUndefined()
    expect(files.read('src/dogs.txt')).toBeUndefined()
    expect(files.read('src/hamsters.txt')).toBeUndefined()
    
    // assert the destination files now exist with the original content
    expect(files.read('dest/foo.bar')).toBeUndefined()
    expect(files.read('dest/cats.txt')).toEqual(content)
    expect(files.read('dest/dogs.txt')).toEqual(content)
    expect(files.read('dest/hamsters.txt')).toEqual(content)
  })
  
})

describe(rm, () => {
  test('specific file is removed file', async () => {
    const source = 'src/source.txt'
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      [source]: content
    }})

    await rm(source)({files, tasks})

    // assert the source file no longer exists
    expect(files.read(source)).toBeUndefined()
    
  })

  test('all files in directory are removed', async () => {
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      ['src/cats.txt']: content,
      ['src/dogs.txt']: content,
      ['src/hamsters.txt']: content
    }})
    
    await rm('src')({files, tasks})

    // assert the source file no longer exists
    expect(files.read('src/cats.txt')).toBeUndefined()
    expect(files.read('src/dogs.txt')).toBeUndefined()
    expect(files.read('src/hamsters.txt')).toBeUndefined()
    
  })

  test('all files matching to glob are copied to destination directory', async () => {
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      ['src/foo.bar']: content,
      ['src/cats.txt']: content,
      ['src/dogs.txt']: content,
      ['src/hamsters.txt']: content,
    }})
    
    await rm('src/*.txt')({files, tasks})

    // assert the source files still exist with the original content
    expect(files.read('src/cats.txt')).toBeUndefined()
    expect(files.read('src/dogs.txt')).toBeUndefined()
    expect(files.read('src/hamsters.txt')).toBeUndefined()
    
  })
  
})

describe(template, () => {
  
  test('substitutes variables', async () => {
    const files = createInMemoryFiles({files: {
      'tpl/package.json': Buffer.from('{"name": "<%= name %>"}')
    }})
    await template('tpl/**/*', 'prj', {name: 'Bob'})({files, tasks})
    expect(files.read('prj/package.json')).toEqual(Buffer.from('{"name": "Bob"}'))
  })

  test('specific file is copied to destination file', async () => {
    const sourceFile = 'src/source.txt'
    const destinationFile = 'dest/copied.txt'
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      [sourceFile]: content
    }})

    await template(sourceFile, destinationFile, {name: 'Bob'})({files, tasks})

    // assert the source file still exists with the original content
    expect(files.read(sourceFile)).toEqual(content)
    
    // assert the destination file now exists with the original content
    expect(files.read(destinationFile)).toEqual(content)
  })

  test('all files in directory are copied to destination directory', async () => {
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      ['src/cats.txt']: content,
      ['src/dogs.txt']: content,
      ['src/hamsters.txt']: content
    }})
    
    await template('src', 'dest', {name: 'Bob'})({files, tasks})

    // assert the source file still exists with the original content
    expect(files.read('src/cats.txt')).toEqual(content)
    expect(files.read('src/dogs.txt')).toEqual(content)
    expect(files.read('src/hamsters.txt')).toEqual(content)
    
    // assert the destination file now exists with the original content
    expect(files.read('dest/cats.txt')).toEqual(content)
    expect(files.read('dest/dogs.txt')).toEqual(content)
    expect(files.read('dest/hamsters.txt')).toEqual(content)
  })

  test('all files matching to glob are copied to destination directory', async () => {
    const content = Buffer.from('content')
    const files = createInMemoryFiles({files: {
      ['src/foo.bar']: content,
      ['src/cats.txt']: content,
      ['src/dogs.txt']: content,
      ['src/hamsters.txt']: content,
    }})
    
    await template('src/*.txt', 'dest', {name: 'Bob'})({files, tasks})

    // assert the source files still exist with the original content
    expect(files.read('src/cats.txt')).toEqual(content)
    expect(files.read('src/dogs.txt')).toEqual(content)
    expect(files.read('src/hamsters.txt')).toEqual(content)
    
    // assert the destination files now exist with the original content
    expect(files.read('dest/foo.bar')).toBeUndefined()
    expect(files.read('dest/cats.txt')).toEqual(content)
    expect(files.read('dest/dogs.txt')).toEqual(content)
    expect(files.read('dest/hamsters.txt')).toEqual(content)
  })

})