<?php

namespace JJB\FormUtilsBundle\Form\Type;

use JJB\FormUtilsBundle\Service\MetaDataConstraintService;
use Symfony\Component\Form\AbstractType;
use Symfony\Component\Form\FormInterface;
use Symfony\Component\Form\FormView;

abstract class AbstractBaseForm extends AbstractType
{
    /**
     * @var MetaDataConstraintService
     */
    protected $metaDataConstraintService;

    /**
     * AbstractBaseForm constructor.
     *
     * @param MetaDataConstraintService|null $metaDataConstraintService
     */
    public function __construct(MetaDataConstraintService $metaDataConstraintService = null)
    {
        $this->metaDataConstraintService = $metaDataConstraintService;
    }

    /**
     * Adds on constraints found in data class' metadata (yaml/xml/annotations)
     *
     * {@inheritdoc}
     */
    public function buildView(FormView $view, FormInterface $form, array $options)
    {
        if ($this->metaDataConstraintService instanceof MetaDataConstraintService) {
            $this->metaDataConstraintService->mergeConstraints($form);
        }
    }
}