const {
    MultiLanguageGenerator,
    LanguageResourceLoader,
    TemplateEngineLanguageGenerator,
    LanguageGeneratorManager,
    ResourceMultiLanguageGenerator,
} = require('../');
const { ResourceExplorer } = require('botbuilder-dialogs-declarative');
const assert = require('assert');
const path = require('path');
const { TestAdapter, TurnContext } = require('botbuilder');
const { DialogContext, DialogSet } = require('botbuilder-dialogs');
const { languageGeneratorKey, languageGeneratorManagerKey } = require('../lib/languageGeneratorExtensions');

const resourceExplorer = new ResourceExplorer().addFolder(path.join(__dirname, 'lg'), true, false);
const languageGeneratorManager = new LanguageGeneratorManager(resourceExplorer);

function getDialogContext(locale, generator) {
    const testAdapter = new TestAdapter();
    const turnContext = new TurnContext(testAdapter, { locale: locale, text: '' });
    const dialogContext = new DialogContext(new DialogSet(), turnContext, { dialogStack: [] });
    dialogContext.services.set(languageGeneratorManagerKey, languageGeneratorManager);
    if (generator) {
        dialogContext.services.set(languageGeneratorKey, generator);
    }
    return dialogContext;
}

describe('LGLanguageGenerator', function () {
    this.timeout(10000);

    it('TestNotFoundTemplate', async function () {
        const lg = new TemplateEngineLanguageGenerator();
        assert.throws(() => {
            lg.generate(getDialogContext(), '${tesdfdfsst()}', undefined);
        }, Error);
    });

    describe('TestMultiLangImport', function () {
        let lgResourceGroup;
        this.beforeAll(async function () {
            lgResourceGroup = await LanguageResourceLoader.groupByLocale(resourceExplorer);
        });

        describe('TestLGResourceGroup', function () {
            it('assert empty locale', async function () {
                assert(lgResourceGroup.has(''));
                const resourceNames = lgResourceGroup.get('').map((u) => u.id);
                assert.equal(resourceNames.length, 7);
                assert.deepStrictEqual(
                    new Set(resourceNames),
                    new Set(['a.lg', 'b.lg', 'c.lg', 'NormalStructuredLG.lg', 'root.lg', 'subDialog.lg', 'test.lg']),
                );
            });

            it('assert en-us locale', async function () {
                assert(lgResourceGroup.has('en-us'));
                const resourceNames = lgResourceGroup.get('en-us').map((u) => u.id);
                assert.equal(resourceNames.length, 7);
                assert.deepStrictEqual(
                    new Set(resourceNames),
                    new Set([
                        'a.en-US.lg',
                        'b.en-us.lg',
                        'test.en-US.lg',
                        'c.en.lg',
                        'NormalStructuredLG.lg',
                        'root.lg',
                        'subDialog.lg',
                    ]),
                );
            });

            it('assert en locale', async function () {
                assert(lgResourceGroup.has('en'));
                const resourceNames = lgResourceGroup.get('en').map((u) => u.id);
                assert.equal(resourceNames.length, 7);
                assert.deepStrictEqual(
                    new Set(resourceNames),
                    new Set([
                        'c.en.lg',
                        'test.en.lg',
                        'a.lg',
                        'b.lg',
                        'NormalStructuredLG.lg',
                        'root.lg',
                        'subDialog.lg',
                    ]),
                );
            });
        });

        describe('Test MultiLang Import with specified locale', function () {
            let generator;
            this.beforeAll(async function () {
                const resource = resourceExplorer.getResource('a.en-US.lg');
                generator = new TemplateEngineLanguageGenerator(resource, lgResourceGroup);
            });

            it('"${templatea()}", no data', async function () {
                const result = await generator.generate(getDialogContext(), '${templatea()}', undefined);
                assert.strictEqual(result, 'from a.en-us.lg');
            });

            it('"${templateb()}", no data', async function () {
                const result = await generator.generate(getDialogContext(), '${templateb()}', undefined);
                assert.strictEqual(result, 'from b.en-us.lg');
            });

            it('"${templatec()}", no data', async function () {
                const result = await generator.generate(getDialogContext(), '${templatec()}', undefined);
                assert.strictEqual(result, 'from c.en.lg');
            });

            it('should throw for missing template: "${greeting()}", no data', async function () {
                assert.throws(() => {
                    generator.generate(getDialogContext(), '${greeting()}', undefined);
                });
            });
        });

        describe('Test Multi-Language Import with no locale', function () {
            let generator;
            this.beforeAll(async function () {
                const resource = resourceExplorer.getResource('a.lg');
                generator = new TemplateEngineLanguageGenerator(resource, lgResourceGroup);
            });

            it('"${templatea()}", no data', async function () {
                const result = await generator.generate(getDialogContext(), '${templatea()}', undefined);
                assert.strictEqual(result, 'from a.lg');
            });

            it('"${templateb()}", no data', async function () {
                const result = await generator.generate(getDialogContext(), '${templateb()}', undefined);
                assert.strictEqual(result, 'from b.lg');
            });

            it('"${templatec()}", no data', async function () {
                const result = await generator.generate(getDialogContext(), '${templatec()}', undefined);
                assert.strictEqual(result, 'from c.lg');
            });

            it('"${greeting()}", no data', async function () {
                const result = await generator.generate(getDialogContext(), '${greeting()}', undefined);
                assert.strictEqual(result, 'hi');
            });
        });
    });

    describe('TestMultiLangGenerator', function () {
        const lg = new MultiLanguageGenerator();

        this.beforeAll(async function () {
            const multiLanguageResources = await LanguageResourceLoader.groupByLocale(resourceExplorer);

            //Should have a setup for the threadLocale here.

            let resource = resourceExplorer.getResource('test.lg');
            lg.languageGenerators.set('', new TemplateEngineLanguageGenerator(resource, multiLanguageResources));

            resource = resourceExplorer.getResource('test.de.lg');
            lg.languageGenerators.set('de', new TemplateEngineLanguageGenerator(resource, multiLanguageResources));

            resource = resourceExplorer.getResource('test.en.lg');
            lg.languageGenerators.set('en', new TemplateEngineLanguageGenerator(resource, multiLanguageResources));

            resource = resourceExplorer.getResource('test.en-US.lg');
            lg.languageGenerators.set('en-us', new TemplateEngineLanguageGenerator(resource, multiLanguageResources));

            resource = resourceExplorer.getResource('test.en-GB.lg');
            lg.languageGenerators.set('en-gb', new TemplateEngineLanguageGenerator(resource, multiLanguageResources));

            resource = resourceExplorer.getResource('test.fr.lg');
            lg.languageGenerators.set('fr', new TemplateEngineLanguageGenerator(resource, multiLanguageResources));
        });

        it('en-US, "${test()}", no data', async function () {
            const result1 = await lg.generate(getDialogContext('en-US'), '${test()}', undefined);
            assert.equal(result1, 'english-us');
        });

        it('en-GB, "${test()}", no data', async function () {
            const result2 = await lg.generate(getDialogContext('en-GB'), '${test()}', undefined);
            assert.equal(result2, 'english-gb');
        });

        it('en, "${test()}", no data', async function () {
            const result3 = await lg.generate(getDialogContext('en'), '${test()}', undefined);
            assert.equal(result3, 'english');
        });

        it('no locale, "${test()}", no data', async function () {
            const result4 = await lg.generate(getDialogContext(''), '${test()}', undefined);
            assert.equal(result4, 'default');
        });

        it('bad locale, "${test()}", no data', async function () {
            const result5 = await lg.generate(getDialogContext('foo'), '${test()}', undefined);
            assert.equal(result5, 'default');
        });

        it('en-US, "${test2()}", country data', async function () {
            const result6 = await lg.generate(getDialogContext('en-US'), '${test2()}', { country: 'US' });
            assert.equal(result6, 'english-US');
        });

        it('en-GB, "${test2()}", no data', async function () {
            const result7 = await lg.generate(getDialogContext('en-GB'), '${test2()}', undefined);
            assert.equal(result7, 'default2');
        });

        it('en, "${test2()}", no data', async function () {
            const result8 = await lg.generate(getDialogContext('en'), '${test2()}', undefined);
            assert.equal(result8, 'default2');
        });

        it('no locale, "${test2()}", no data', async function () {
            const result9 = await lg.generate(getDialogContext(''), '${test2()}', undefined);
            assert.equal(result9, 'default2');
        });

        it('bad locale, "${test2()}", no data', async function () {
            const result10 = await lg.generate(getDialogContext('foo'), '${test2()}', undefined);
            assert.equal(result10, 'default2');
        });
    });

    describe('TestResourceMultiLangGenerator', function () {
        const lg = new ResourceMultiLanguageGenerator('test.lg');
        /*
        it('en-us, "${test()}", no data', async () => {
            const result1 = await lg.generate(await getTurnContext('en-us', lg), '${test()}', undefined);
            assert.equal(result1, 'english-us');
        });

        it('en-us, "${test()}", country data', async () => {
            const result2 = await lg.generate(await getTurnContext('en-us', lg), '${test()}', { country: 'us' });
            assert.equal(result2, 'english-us');
        });

        it('en-gb, "${test()}", no data', async () => {
            const result3 = await lg.generate(await getTurnContext('en-gb', lg), '${test()}', undefined);
            assert.equal(result3, 'english-gb');
        });
        */
        it('en, "${test()}", no data', async function () {
            const result4 = await lg.generate(getDialogContext('en', lg), '${test()}', undefined);
            assert.equal(result4, 'english');
        });

        it('no locale, "${test()}", no data', async function () {
            const result5 = await lg.generate(getDialogContext('', lg), '${test()}', undefined);
            assert.equal(result5, 'default');
        });

        it('bad locale, "${test()}", no data', async function () {
            const result6 = await lg.generate(getDialogContext('foo', lg), '${test()}', undefined);
            assert.equal(result6, 'default');
        });

        it('en-gb, "${test2()}", no data', async function () {
            const result7 = await lg.generate(getDialogContext('en-gb', lg), '${test2()}', undefined);
            assert.equal(result7, 'default2');
        });

        it('en, "${test2()}", no data', async function () {
            const result8 = await lg.generate(getDialogContext('en', lg), '${test2()}', undefined);
            assert.equal(result8, 'default2');
        });

        it('no locale, "${test2()}", no data', async function () {
            const result9 = await lg.generate(getDialogContext('', lg), '${test2()}', undefined);
            assert.equal(result9, 'default2');
        });

        it('bad locale, "${test2()}", no data', async function () {
            const result10 = await lg.generate(getDialogContext('foo', lg), '${test2()}', undefined);
            assert.equal(result10, 'default2');
        });
        /*
        it('en-us, "${test2()}", country data', async () => {
            const result11 = await lg.generate(await getTurnContext('en-us', lg), '${test2()}', {country: 'US'});
            assert.equal(result11, 'english-US');
        });
        */
    });
});
