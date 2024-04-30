import { CreateVirtualFilesOptions, createVirtualFiles } from "./createVirtualFiles.js";

describe(createVirtualFiles, () => {
  describe(".exists()", () => {
    test("file does not exist when the file does not already exist on disk", () => {
      const file = "foo.bar";
      const files = createVirtualFiles({
        fs: { existsSync: jest.fn().mockReturnValue(false) },
      });
      expect(files.exists(file)).toBeFalsy();
    });

    test("file exists when the file already exists on disk", () => {
      const file = "foo.bar";
      const files = createVirtualFiles({
        fs: { existsSync: jest.fn().mockReturnValue(true) },
      });
      expect(files.exists(file)).toBeTruthy();
    });

    test("file exists when the file does not already exist on disk but it has been created", () => {
      const file = "foo.bar";
      const files = createVirtualFiles({
        fs: { existsSync: jest.fn().mockReturnValue(false) },
      });
      files.write(file, "Hello World!");
      expect(files.exists(file)).toBeTruthy();
    });

    test("file does not exist when the file already exists on disk but it has been deleted", () => {
      const file = "foo.bar";
      const files = createVirtualFiles({
        fs: { existsSync: jest.fn().mockReturnValue(true) },
      });
      files.delete(file);
      expect(files.exists(file)).toBeFalsy();
    });
  });

  describe('.read()', () => {
    test("throws when the file does not already exist on disk", () => {
      const file = "foo.bar";
      const files = createVirtualFiles({
        fs: { existsSync: jest.fn().mockReturnValue(false) },
      });
      expect(() => files.read(file)).toThrow(/ENOENT/);
    });

    test("returns a string when the file already exists on disk", () => {
      const file = "foo.bar";
      const content = 'Hello World!'
      const files = createVirtualFiles({
        fs: { readFileSync: jest.fn().mockReturnValue(Buffer.from(content)) },
      });
      expect(files.read(file)).toEqual(content);
    });

    test("returns a string when the file does not already exist on disk but it has been created", () => {
      const file = "foo.bar";
      const content = 'Hello World!'
      const files = createVirtualFiles({});
      files.write(file, content);
      expect(files.read(file)).toEqual(content);
    });

    test("throws when the file already exists on disk but it has been deleted", () => {
      const file = "foo.bar";
      const files = createVirtualFiles({
        fs: { existsSync: jest.fn().mockReturnValue(true) },
      });
      files.delete(file);
      expect(() => files.read(file)).toThrow(/ENOENT/);
    });
  })

  describe('.list()', () => {
    
  })

  describe('.diff()', () => {
    test('file should be created when it is written and it did not already exist', () => {
      const file = 'foo.bar'
      const content = 'Hello World!'
      const files = createVirtualFiles({fs: {existsSync: jest.fn().mockReturnValue(false)}})
      files.write(file, content)
      const diff = files.diff()
      expect(diff[file]).toEqual('C')
    })
  
    test('file should be modified when it is written and it already existed', () => {
      const file = 'foo.bar'
      const content = 'Hello World!'
      const files = createVirtualFiles({fs: {existsSync: jest.fn().mockReturnValue(true)}})
      files.write(file, content)
      const diff = files.diff()
      expect(diff[file]).toEqual('M')
    })
  
    test('file should be deleted when it is written and it already existed', () => {
      const file = 'foo.bar'
      const files = createVirtualFiles({fs: {existsSync: jest.fn().mockReturnValue(true)}})
      files.delete(file)
      const diff = files.diff()
      expect(diff[file]).toEqual('D')
    })
  })

  describe('.apply()', () => {

    test('does not write files to disk when no files have changed', () => {
      const changes = {}
      const fs: CreateVirtualFilesOptions['fs'] = {
        writeFileSync: jest.fn()
      }
      const files = createVirtualFiles({fs})
      files.apply()
      expect(fs.writeFileSync).not.toBeCalled()
    })
  
    test('does not delete files from disk when no files have changed', () => {
      const changes = {} as const
      const fs: CreateVirtualFilesOptions['fs'] = {
        unlinkSync: jest.fn()
      }
      const files = createVirtualFiles({fs})
      files.apply()
      expect(fs.unlinkSync).not.toBeCalled()
    })
  
    test('writes files to disk when files have changed', () => {
      const file = 'foo.bar'
      const content = 'Hello World!'
      const fs: CreateVirtualFilesOptions['fs'] = {
        writeFileSync: jest.fn()
      }
      const files = createVirtualFiles({fs})
      files.write(file, content)
      files.apply()
      expect(fs.writeFileSync).toBeCalledWith(file, content)
    })
  
    test('deletes files to disk when files have changed', () => {
      const file = 'foo.bar'
      const fs: CreateVirtualFilesOptions['fs'] = {
        unlinkSync: jest.fn()
      }
      const files = createVirtualFiles({fs})
      files.delete(file)
      files.apply()
      expect(fs.unlinkSync).toBeCalledWith(file)
    })
  })
  

});
