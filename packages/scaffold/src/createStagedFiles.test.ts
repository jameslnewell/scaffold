import { createInMemoryFiles } from "./createInMemoryFiles.js";
import { createStagedFiles } from "./createStagedFiles.js";

describe(createStagedFiles, () => {
  describe(".stat()", () => {
    test("file does not exist when the file does not already exist on disk", () => {
      const file = "foo/bar";
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {}})
      });
      expect(files.stat(file)).toBeUndefined();
    });

    test("file exists when the file already exists on disk", () => {
      const file = "foo/bar";
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {[file]: Buffer.from('conent')}})
      });
      expect(files.stat(file)).toEqual({
        isFile: true,
        isDirectory: false
      });
    });

    test("file exists when the file does not already exist on disk but it has been created", () => {
      const file = "foo/bar";
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {}})
      });
      files.write(file, Buffer.from("Hello World!"));
      expect(files.stat(file)).toEqual({
        isFile: true,
        isDirectory: false
      });
    });

    test("file does not exist when the file already exists on disk but it has been deleted", () => {
      const file = "foo/bar";
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {[file]: Buffer.from('content')}})
      });
      files.delete(file);
      expect(files.stat(file)).toBeUndefined();
    });
  });

  describe('.read()', () => {
    test("returns undefined when the file does not already exist on disk", () => {
      const file = "foo/bar";
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {}})
      });
      expect(files.read(file)).toBeUndefined();
    });

    test("returns a string when the file already exists on disk", () => {
      const file = "foo/bar";
      const content = Buffer.from('Hello World!')
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {[file]: content}})
      });
      expect(files.read(file)).toEqual(content);
    });

    test("returns a string when the file does not already exist on disk but it has been created", () => {
      const file = "foo/bar";
      const content = Buffer.from('Hello World!')
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {}})
      });
      files.write(file, content);
      expect(files.read(file)).toEqual(content);
    });

    test("returns undefined when the file already exists on disk but it has been deleted", () => {
      const file = "foo/bar";
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {[file]: Buffer.from('content')}})
      });
      files.delete(file);
      expect(files.read(file)).toBeUndefined();
    });
  })

  describe('.list()', () => {
    
  })

  describe('.diff()', () => {
    test('file should be created when it is written and it did not already exist', () => {
      const file = 'foo/bar'
      const content = Buffer.from('Hello World!')
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {}})
      });
      files.write(file, content)
      const diff = files.diff()
      expect(diff[file]).toEqual('C')
    })
  
    test('file should be modified when it is written and it already existed', () => {
      const file = 'foo/bar'
      const content = Buffer.from('Hello World!')
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {[file]: Buffer.from('content')}})
      });
      files.write(file, content)
      const diff = files.diff()
      expect(diff[file]).toEqual('M')
    })
  
    test('file should be deleted when it is written and it already existed', () => {
      const file = 'foo/bar'
      const files = createStagedFiles({
        host: createInMemoryFiles({ files: {[file]: Buffer.from('content')}})
      });
      files.delete(file)
      const diff = files.diff()
      expect(diff[file]).toEqual('D')
    })
  })

  describe('.apply()', () => {

    test('does not write files to disk when no files have changed', () => {
      const hostFiles = createInMemoryFiles({ files: {}})
      const mockWriteFn = jest.spyOn(hostFiles, 'write')
      const files = createStagedFiles({host: hostFiles})
      files.apply()
      expect(mockWriteFn).not.toBeCalled()
    })
  
    test('does not delete files from disk when no files have changed', () => {
      const hostFiles = createInMemoryFiles({ files: {}})
      const mockDeleteFn = jest.spyOn(hostFiles, 'delete')
      const files = createStagedFiles({host: hostFiles})
      files.apply()
      expect(mockDeleteFn).not.toBeCalled()
    })
  
    test('writes files to disk when files have changed', () => {
      const file = 'foo/bar'
      const content = Buffer.from('Hello World!')
      const hostFiles = createInMemoryFiles({ files: {}})
      const mockWriteFn = jest.spyOn(hostFiles, 'write')
      const files = createStagedFiles({host: hostFiles})
      files.write(file, content)
      files.apply()
      expect(mockWriteFn).toBeCalledWith(`${files.cwd}/${file}`, content)
    })
  
    test('deletes files from disk when files have changed', () => {
      const file = 'foo/bar'
      const hostFiles = createInMemoryFiles({ files: {}})
      const mockDeleteFn = jest.spyOn(hostFiles, 'delete')
      const files = createStagedFiles({
        host: hostFiles
      });
      files.delete(file)
      files.apply()
      expect(mockDeleteFn).toBeCalledWith(`${files.cwd}/${file}`)
    })
  })
  

});
