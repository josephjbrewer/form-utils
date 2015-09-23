<?php

namespace JJB\FormUtilsBundle\Twig;

use JJB\FormUtilsBundle\Service\JSConstraintService;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints;

class JSConstraintExtension extends \Twig_Extension
{
    /**
     * @var JSConstraintService
     */
    private $jsConstraintService;


    public function __construct(JSConstraintService $jsConstraintService)
    {
        $this->jsConstraintService = $jsConstraintService;
    }

    public function getFilters()
    {
        return [
            new \Twig_SimpleFilter('add_js_constraints', [$this, 'addJsConstraints'])
        ];
    }

    /**
     * @param string $fieldName
     * @param array $attributes
     * @param Constraint[] $constraints
     * @param null|string $domain
     * @return string
     * @throws \Exception
     */
    public function addJsConstraints($fieldName, array $attributes, array $constraints = [], $domain = null)
    {
        $tests    = [];
        $messages = [];

        if (!empty($constraints)) {
            foreach ($constraints as $constraint) {
                if (!$constraint instanceof Constraint) {
                    throw new \Exception("The constraint provided for '{$fieldName}' is not an instance of Constraint. Please make sure you did not nest an array");
                }

                list ($tests, $messages) = $this->jsConstraintService->extractConstraints($constraint, $domain, $tests, $messages);

            }

            if (!empty($tests) && !empty($messages)) {
                $attributes = array_merge($attributes, [
                        'data-constraints'    => json_encode($tests),
                        'data-error-messages' => json_encode($messages)
                    ]
                );
            }
        }

        return $attributes;
    }

    public function getName()
    {
        return 'js_constraint_extension';
    }
}

