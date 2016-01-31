<?php

namespace JJB\FormUtilsBundle\Twig;

use JJB\FormUtilsBundle\Service\JSConstraintService;
use Symfony\Component\Form\FormView;
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

    public function getFunctions()
    {
        return [
            new \Twig_SimpleFunction('add_js_constraints', [$this, 'addJsConstraints'])
        ];
    }

    /**
     * @param FormView $form
     * @param Constraint[] $constraints
     * @param array $attributes
     * @param null|string $domain
     * @return string
     * @throws \Exception
     */
    public function addJsConstraints($form, array $constraints = [], array $attributes = [], $domain = null)
    {
        if (!empty($constraints)) {
            $tests    = [];
            $messages = [];

            foreach ($constraints as $constraint) {
                if (!$constraint instanceof Constraint) {
                    throw new \Exception("The constraint provided for " . $form->vars['id'] . " is not an instance of Constraint. Please make sure you did not nest an array");
                }

                list ($_tests, $_messages) = $this->jsConstraintService->extractConstraints($form, $constraint, $domain);

                if (is_array($_tests)) {
                    foreach ($_tests as $key => $test) {
                        $tests[]    = $_tests[ $key ];
                        $messages[] = $_messages[ $key ];
                    }
                } else {
                    $tests[]    = $_tests;
                    $messages[] = $_messages;
                }

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

