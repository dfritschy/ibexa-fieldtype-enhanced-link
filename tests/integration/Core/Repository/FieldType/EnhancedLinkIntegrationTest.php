<?php

declare(strict_types=1);

namespace Netgen\IbexaFieldTypeEnhancedLink\Tests\Integration\Core\Repository\FieldType;

use Ibexa\Contracts\Core\Repository\Values\Content\Content;
use Ibexa\Contracts\Core\Repository\Values\Content\Field;
use Ibexa\Contracts\Core\Repository\Values\Content\Relation as APIRelation;
use Ibexa\Contracts\Core\Repository\Values\ContentType\ContentType;
use Ibexa\Core\Base\Exceptions\InvalidArgumentType;
use Ibexa\Core\Repository\Values\Content\Relation;
use Ibexa\Tests\Integration\Core\Repository\FieldType\BaseIntegrationTest;
use Ibexa\Tests\Integration\Core\Repository\FieldType\RelationSearchBaseIntegrationTestTrait;
use Netgen\IbexaFieldTypeEnhancedLink\FieldType\Type;
use Netgen\IbexaFieldTypeEnhancedLink\FieldType\Value;

use function PHPUnit\Framework\assertEquals;

/**
 * Integration test for use field type.
 *
 * @group integration
 * @group field-type
 */
class EnhancedLinkIntegrationTest extends BaseIntegrationTest
{
    use RelationSearchBaseIntegrationTestTrait;

    public function getTypeName(): string
    {
        return 'ngenhancedlink';
    }

    /**
     * @throws \Ibexa\Contracts\Core\Repository\Exceptions\NotFoundException
     * @throws \Ibexa\Contracts\Core\Repository\Exceptions\UnauthorizedException
     */
    public function getCreateExpectedRelations(Content $content): array
    {
        $contentService = $this->getRepository()->getContentService();

        return [
            new Relation(
                [
                    'sourceFieldDefinitionIdentifier' => 'data',
                    'type' => APIRelation::FIELD,
                    'sourceContentInfo' => $content->contentInfo,
                    'destinationContentInfo' => $contentService->loadContentInfo(4),
                ],
            ),
        ];
    }

    /**
     * @throws \Ibexa\Contracts\Core\Repository\Exceptions\NotFoundException
     * @throws \Ibexa\Contracts\Core\Repository\Exceptions\UnauthorizedException
     */
    public function getUpdateExpectedRelations(Content $content): array
    {
        $contentService = $this->getRepository()->getContentService();

        return [
            new Relation(
                [
                    'sourceFieldDefinitionIdentifier' => 'data',
                    'type' => APIRelation::FIELD,
                    'sourceContentInfo' => $content->contentInfo,
                    'destinationContentInfo' => $contentService->loadContentInfo(49),
                ],
            ),
        ];
    }

    public function getSettingsSchema(): array
    {
        return [
            'selectionMethod' => [
                'type' => 'int',
                'default' => Type::SELECTION_BROWSE,
            ],
            'selectionRoot' => [
                'type' => 'string',
                'default' => null,
            ],
            'rootDefaultLocation' => [
                'type' => 'bool',
                'default' => false,
            ],
            'selectionContentTypes' => [
                'type' => 'array',
                'default' => [],
            ],
            'allowedLinkType' => [
                'type' => 'choice',
                'default' => Type::LINK_TYPE_ALL,
            ],
            'allowedTargetsInternal' => [
                'type' => 'array',
                'default' => [
                    Type::TARGET_LINK,
                    Type::TARGET_LINK_IN_NEW_TAB,
                    Type::TARGET_EMBED,
                    Type::TARGET_MODAL,
                ],
            ],
            'allowedTargetsExternal' => [
                'type' => 'array',
                'default' => [
                    Type::TARGET_LINK,
                    Type::TARGET_LINK_IN_NEW_TAB,
                ],
            ],
            'enableSuffix' => [
                'type' => 'bool',
                'default' => true,
            ],
            'enableLabel' => [
                'type' => 'bool',
                'default' => true,
            ],
        ];
    }

    public function getValidatorSchema(): array
    {
        return [];
    }

    public function getValidFieldSettings(): array
    {
        return [
            'selectionMethod' => Type::SELECTION_BROWSE,
            'selectionRoot' => 1,
            'rootDefaultLocation' => false,
            'selectionContentTypes' => [],
            'allowedLinkType' => Type::LINK_TYPE_ALL,
            'allowedTargetsInternal' => [Type::TARGET_LINK, Type::TARGET_LINK_IN_NEW_TAB, Type::TARGET_EMBED, Type::TARGET_MODAL],
            'allowedTargetsExternal' => [Type::TARGET_LINK, Type::TARGET_LINK_IN_NEW_TAB],
            'enableSuffix' => false,
            'enableLabel' => true,
        ];
    }

    public function getValidValidatorConfiguration(): array
    {
        return [];
    }

    public function getInvalidFieldSettings(): array
    {
        return [
            'selectionMethod' => 'a',
            'selectionRoot' => true,
            'unknownSetting' => false,
            'selectionContentTypes' => true,
        ];
    }

    public function getInvalidValidatorConfiguration(): array
    {
        return ['noValidator' => true];
    }

    public function getValidCreationFieldData(): Value
    {
        return new Value(4, 'label', Type::TARGET_LINK, 'suffix');
    }

    public function getValidExternalCreationFieldData(): Value
    {
        return new Value('https://www.google.com/', 'label', Type::TARGET_LINK);
    }

    /**
     * @depends testLoadContentTypeField
     */
    public function testCreateExternalContent()
    {
        $content = $this->createContent($this->getValidExternalCreationFieldData());
        self::assertNotNull($content->id);

        return $content;
    }

    public function getFieldName(): string
    {
        return 'Users';
    }

    public function assertFieldDataLoadedCorrect(Field $field): void
    {
        self::assertInstanceOf(
            Value::class,
            $field->value,
        );

        $expectedData = [
            'reference' => 4,
            'label' => 'label',
            'target' => Type::TARGET_LINK,
            'suffix' => 'suffix',
        ];
        $this->assertPropertiesCorrect(
            $expectedData,
            $field->value,
        );
    }

    public function provideInvalidCreationFieldData(): array
    {
        return [
            [
                new Value([]),
                InvalidArgumentType::class,
            ],
        ];
    }

    public function testUpdateExternalField()
    {
        $updatedContent = $this->updateContent($this->getValidUpdateExternalFieldData());
        self::assertNotNull($updatedContent->id);
        assertEquals($updatedContent->getField('data')->value->reference, 'https://www.youtube.com/');

        return $updatedContent;
    }

    public function getValidUpdateFieldData(): Value
    {
        return new Value(49, 'label', Type::TARGET_LINK, 'suffix');
    }

    public function getValidUpdateExternalFieldData(): Value
    {
        return new Value('https://www.youtube.com/', 'label', Type::TARGET_LINK);
    }

    public function assertUpdatedFieldDataLoadedCorrect(Field $field): void
    {
        self::assertInstanceOf(Value::class, $field->value);

        $expectedData = [
            'reference' => 49,
            'label' => 'label',
            'target' => Type::TARGET_LINK,
            'suffix' => 'suffix',
        ];
        $this->assertPropertiesCorrect(
            $expectedData,
            $field->value,
        );
    }

    /**
     * @dataProvider provideFieldSettings
     *
     * @param mixed $settings
     * @param mixed $expectedSettings
     */
    public function testCreateContentTypes($settings, $expectedSettings): ContentType
    {
        $contentType = $this->createContentType(
            $settings,
            $this->getValidValidatorConfiguration(),
            $this->getValidContentTypeConfiguration(),
            $this->getValidFieldConfiguration(),
        );
        self::assertNotNull($contentType->id);
        self::assertEquals($expectedSettings, $contentType->fieldDefinitions[1]->fieldSettings);

        return $contentType;
    }

    public function provideInvalidUpdateFieldData(): array
    {
        return $this->provideInvalidCreationFieldData();
    }

    public function assertCopiedFieldDataLoadedCorrectly(Field $field): void
    {
        self::assertInstanceOf(
            Value::class,
            $field->value,
        );

        $expectedData = [
            'reference' => 4,
            'label' => 'label',
            'target' => Type::TARGET_LINK,
            'suffix' => 'suffix',
        ];

        $this->assertPropertiesCorrect(
            $expectedData,
            $field->value,
        );
    }

    public function provideFieldSettings(): array
    {
        return [
            'empty_settings' => [
                [],
                [
                    'selectionMethod' => Type::SELECTION_BROWSE,
                    'selectionRoot' => null,
                    'rootDefaultLocation' => false,
                    'selectionContentTypes' => [],
                    'allowedLinkType' => Type::LINK_TYPE_ALL,
                    'allowedTargetsInternal' => [Type::TARGET_LINK, Type::TARGET_LINK_IN_NEW_TAB, Type::TARGET_EMBED, Type::TARGET_MODAL],
                    'allowedTargetsExternal' => [Type::TARGET_LINK, Type::TARGET_LINK_IN_NEW_TAB],
                    'enableSuffix' => true,
                    'enableLabel' => true,
                ],
            ],
            'incomplete_settings' => [
                [
                    'selectionMethod' => Type::SELECTION_BROWSE,
                    'allowedLinkType' => Type::LINK_TYPE_INTERNAL,
                    'enableSuffix' => true,
                ],
                [
                    'selectionMethod' => Type::SELECTION_BROWSE,
                    'selectionRoot' => null,
                    'rootDefaultLocation' => false,
                    'selectionContentTypes' => [],
                    'allowedLinkType' => Type::LINK_TYPE_INTERNAL,
                    'allowedTargetsInternal' => [Type::TARGET_LINK, Type::TARGET_LINK_IN_NEW_TAB, Type::TARGET_EMBED, Type::TARGET_MODAL],
                    'allowedTargetsExternal' => [Type::TARGET_LINK, Type::TARGET_LINK_IN_NEW_TAB],
                    'enableSuffix' => true,
                    'enableLabel' => true,
                ],
            ],
        ];
    }

    public function provideToHashData(): array
    {
        return [
            [
                new Value(4, 'label', Type::TARGET_LINK, 'suffix'),
                [
                    'reference' => 4,
                    'label' => 'label',
                    'target' => Type::TARGET_LINK,
                    'suffix' => 'suffix',
                ],
            ],
        ];
    }

    public function provideFromHashData(): array
    {
        return [
            [
                [
                    'reference' => 4,
                    'label' => 'label',
                    'target' => Type::TARGET_LINK,
                    'suffix' => 'suffix',
                ],
                new Value(4, 'label', Type::TARGET_LINK, 'suffix'),
            ],
        ];
    }

    public function providerForTestIsEmptyValue(): array
    {
        return [
            [new Value()],
        ];
    }

    public function providerForTestIsNotEmptyValue(): array
    {
        return [
            [
                $this->getValidCreationFieldData(),
            ],
        ];
    }
}
