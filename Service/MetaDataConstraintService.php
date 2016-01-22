<?php

namespace JJB\FormUtilsBundle\Service;

use Symfony\Component\Form\FormInterface;
use Symfony\Component\Validator\Mapping\ClassMetadata;
use Symfony\Component\Validator\Validator\ValidatorInterface;

/**
 * Class MetaDataConstraintService
 *
 * @package JJB\FormUtilsBundle\Service
 */
class MetaDataConstraintService
{
    /**
     * @var ValidatorInterface
     */
    protected $validator;

    /**
     * @var string|null
     */
    protected $dataClass;

    /**
     * MetaDataConstraintService constructor.
     *
     * @param ValidatorInterface $validator
     */
    public function __construct(ValidatorInterface $validator)
    {
        $this->validator = $validator;
    }

    /**
     * @return null|string
     */
    public function getDataClass()
    {
        return $this->dataClass;
    }

    /**
     * @param null|string $dataClass
     * @return $this
     */
    public function setDataClass($dataClass)
    {
        $this->dataClass = $dataClass;

        return $this;
    }

    /**
     * Merges constraints from the form with constraints in the class metaData
     *
     * @param FormInterface $form
     */
    public function mergeConstraints(FormInterface &$form)
    {
        $metaData  = null;
        $dataClass = $form->getConfig()->getDataClass();

        if ($dataClass != '') {
            $metaData = $this->validator->getMetadataFor($dataClass);
        }

        if ($metaData instanceof ClassMetadata) {
            /**
             * @var FormInterface $child
             */
            foreach ($form->all() as $child) {
                $options = $child->getConfig()->getOptions();
                $name    = $child->getConfig()->getName();
                $type    = $child->getConfig()->getType()->getName();

                if (isset($options['constraints'])) {
                    $existingConstraints  = $options['constraints'];
                    $extractedConstraints = $this->extractPropertyConstraints($name, $metaData);

                    // Merge all constraints
                    $options['constraints'] = array_merge($existingConstraints, $extractedConstraints);
                }

                $form->add($name, $type, $options);
            }
        }
    }

    /**
     * Extracts constraints from the property metaData
     *
     * @param string $property
     * @param ClassMetadata $metaData
     * @return array
     */
    protected function extractPropertyConstraints($property, ClassMetadata $metaData)
    {
        $constraints  = [];
        $propertyName = $this->convertToCamelCase($property);

        if ($propertyName) {
            $propertyMetaData = $metaData->getPropertyMetadata($propertyName);

            if ($propertyMetaData) {
                $propertyOptions = array_pop($propertyMetaData);
                $constraints     = $propertyOptions->getConstraints();
            }
        }

        return $constraints;
    }

    /**
     * Converts snake_case to camelCase
     *
     * @param string $key
     * @return string
     */
    protected function convertToCamelCase($key)
    {
        $newKey = '';
        $parts  = explode("_", $key);

        foreach ($parts as $part) {
            $newKey .= ucfirst($part);
        }

        return lcfirst($newKey);
    }
}